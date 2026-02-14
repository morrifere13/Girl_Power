const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const isDev = () => process.env.NODE_ENV !== 'production';

let tableColumnsCache = null;
let tableColumnsPromise = null;

const tableExists = async (tableName) => {
    const [rows] = await db.query('SHOW TABLES LIKE ?', [tableName]);
    return Array.isArray(rows) && rows.length > 0;
};

const getTableColumns = async (tableName) => {
    if (!tableColumnsCache) tableColumnsCache = new Map();
    if (tableColumnsCache.has(tableName)) return tableColumnsCache.get(tableName);

    if (!tableColumnsPromise) tableColumnsPromise = new Map();
    if (tableColumnsPromise.has(tableName)) return tableColumnsPromise.get(tableName);

    const p = (async () => {
        const [columns] = await db.query(`SHOW COLUMNS FROM \`${tableName}\``);
        const list = columns.map(c => c.Field);
        tableColumnsCache.set(tableName, list);
        return list;
    })().finally(() => {
        tableColumnsPromise.delete(tableName);
    });

    tableColumnsPromise.set(tableName, p);
    return p;
};

const safeJsonParse = (value, fallback) => {
    if (value == null) return fallback;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch (e) {
        return fallback;
    }
};

// Helper: Calculate detailed duration
const calculateDetailedDuration = (start, end) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
    if (endDate < startDate) return "0 jours";

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} an${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mois`);
    if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : "0 jours";
};

// GET /stats - Global KPIs
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const cohortesExists = await tableExists('cohortes');
        if (!cohortesExists) {
            return res.json({ total: 0, en_cours: 0, terminees: 0, centres_uniques: 0, projets_uniques: 0 });
        }

        const cohortesColumns = await getTableColumns('cohortes');
        const cohortesSet = new Set(cohortesColumns);

        const whereParts = [];
        if (cohortesSet.has('deleted_at')) whereParts.push('deleted_at IS NULL');
        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        const [totalRows] = await db.query(`SELECT COUNT(*) as count FROM cohortes ${whereClause}`);

        const canFilterStatus = cohortesSet.has('statut');
        const [enCoursRows] = canFilterStatus
            ? await db.query(`SELECT COUNT(*) as count FROM cohortes ${whereClause}${whereClause ? ' AND' : ' WHERE'} statut = "EN_COURS"`)
            : [[{ count: 0 }]];

        const [termineesRows] = canFilterStatus
            ? await db.query(`SELECT COUNT(*) as count FROM cohortes ${whereClause}${whereClause ? ' AND' : ' WHERE'} statut = "TERMINEE"`)
            : [[{ count: 0 }]];

        const cohorteCentresExists = await tableExists('cohorte_centres');
        const centresUnique = cohorteCentresExists
            ? (await db.query('SELECT COUNT(DISTINCT centre_id) as count FROM cohorte_centres'))[0]
            : (cohortesSet.has('centre_id')
                ? (await db.query(`SELECT COUNT(DISTINCT centre_id) as count FROM cohortes ${whereClause}`))[0]
                : [{ count: 0 }]);

        const projetsUnique = cohortesSet.has('projet_id')
            ? (await db.query(`SELECT COUNT(DISTINCT projet_id) as count FROM cohortes ${whereClause}`))[0]
            : [{ count: 0 }];

        res.json({
            total: totalRows[0].count,
            en_cours: enCoursRows[0].count,
            terminees: termineesRows[0].count,
            centres_uniques: centresUnique[0].count,
            projets_uniques: projetsUnique[0].count
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            message: 'Erreur serveur',
            ...(isDev() ? { error: error.message } : {})
        });
    }
});

// GET / - List all cohortes with filters (Updated for Multi-Centre)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { search, projet_id, statut, region, centre_id, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const cohortesExists = await tableExists('cohortes');
        if (!cohortesExists) {
            return res.json({ data: [], pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, totalPages: 0 } });
        }

        const cohortesColumns = await getTableColumns('cohortes');
        const cohortesSet = new Set(cohortesColumns);

        const projectsExists = await tableExists('projects');
        const centresExists = await tableExists('centres');
        const cohorteCentresExists = await tableExists('cohorte_centres');

        const whereParts = [];
        if (cohortesSet.has('deleted_at')) {
            whereParts.push('c.deleted_at IS NULL');
        }
        const params = [];

        if (search) {
            const searchParts = [];
            if (cohortesSet.has('nom')) searchParts.push('c.nom LIKE ?');
            if (cohortesSet.has('code')) searchParts.push('c.code LIKE ?');
            if (searchParts.length) {
                whereParts.push(`(${searchParts.join(' OR ')})`);
                params.push(...searchParts.map(() => `%${search}%`));
            }
        }
        if (projet_id && cohortesSet.has('projet_id')) {
            whereParts.push('c.projet_id = ?');
            params.push(projet_id);
        }
        if (statut && cohortesSet.has('statut')) {
            whereParts.push('c.statut = ?');
            params.push(statut);
        }
        if (region && cohortesSet.has('region')) {
            whereParts.push('c.region = ?');
            params.push(region);
        }
        // Legacy schema filter
        if (centre_id && cohortesSet.has('centre_id')) {
            whereParts.push('c.centre_id = ?');
            params.push(centre_id);
        }

        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        const baseSelect = `
            SELECT c.*${projectsExists ? ', p.nom as projet_nom' : ''}${(!cohorteCentresExists && centresExists && cohortesSet.has('centre_id')) ? ', cnt.id as centre_id, cnt.nom as centre_nom' : ''}
            FROM cohortes c
            ${projectsExists ? 'LEFT JOIN projects p ON c.projet_id = p.id' : ''}
            ${(!cohorteCentresExists && centresExists && cohortesSet.has('centre_id')) ? 'LEFT JOIN centres cnt ON c.centre_id = cnt.id' : ''}
            ${whereClause}
        `;

        const [countResult] = await db.query(`SELECT COUNT(*) as count FROM cohortes c ${whereClause}`, params);
        const total = countResult[0].count;

        const orderBy = cohortesSet.has('created_at') ? 'c.created_at DESC' : 'c.id DESC';
        const listQuery = `${baseSelect} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;

        const [cohortes] = await db.query(listQuery, [...params, parseInt(limit), parseInt(offset)]);

        // Hydrate centres without JSON functions
        const cohortesIds = cohortes.map(c => c.id).filter(Boolean);
        let centresByCohorteId = new Map();
        if (cohorteCentresExists && centresExists && cohortesIds.length > 0) {
            const placeholders = cohortesIds.map(() => '?').join(',');
            const [rows] = await db.query(
                `SELECT cc.cohorte_id, cnt.id, cnt.nom
                 FROM cohorte_centres cc
                 JOIN centres cnt ON cnt.id = cc.centre_id
                 WHERE cc.cohorte_id IN (${placeholders})`,
                cohortesIds
            );
            for (const r of rows) {
                if (!centresByCohorteId.has(r.cohorte_id)) centresByCohorteId.set(r.cohorte_id, []);
                centresByCohorteId.get(r.cohorte_id).push({ id: r.id, nom: r.nom });
            }
        }

        const processedCohortes = cohortes.map(c => {
            const centres = cohorteCentresExists
                ? (centresByCohorteId.get(c.id) || [])
                : (c.centre_id && c.centre_nom ? [{ id: c.centre_id, nom: c.centre_nom }] : []);

            let zones = [];
            if (c.zones_intervention) {
                zones = safeJsonParse(c.zones_intervention, []);
            }

            return {
                ...c,
                centres,
                zones_intervention: zones,
                duree_recrutement: calculateDetailedDuration(c.date_debut_recrutement, c.date_fin_recrutement),
                duree_formation: calculateDetailedDuration(c.date_entree_centre, c.date_fin_formation)
            };
        });

        res.json({
            data: processedCohortes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching cohortes:', error);
        res.status(500).json({
            message: 'Erreur serveur',
            ...(isDev() ? { details: error.message } : {})
        });
    }
});

// GET /:id - Detail (Updated for Multi-Centre)
router.get('/:id(\\d+)', verifyToken, async (req, res) => {
    try {
        const cohortesExists = await tableExists('cohortes');
        if (!cohortesExists) return res.status(404).json({ message: 'Cohorte non trouvée' });

        const cohortesColumns = await getTableColumns('cohortes');
        const cohortesSet = new Set(cohortesColumns);

        const projectsExists = await tableExists('projects');
        const centresExists = await tableExists('centres');
        const cohorteCentresExists = await tableExists('cohorte_centres');

        const whereParts = ['c.id = ?'];
        if (cohortesSet.has('deleted_at')) whereParts.push('c.deleted_at IS NULL');
        const whereClause = `WHERE ${whereParts.join(' AND ')}`;

        const [rows] = await db.query(`
            SELECT c.*, 
                   ${projectsExists ? 'p.nom as projet_nom' : 'NULL as projet_nom'}
            FROM cohortes c
            ${projectsExists ? 'LEFT JOIN projects p ON c.projet_id = p.id' : ''}
            ${whereClause}
        `, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Cohorte non trouvée' });

        const cohorte = rows[0];

        // Fetch Linked Centres (support pivot-table and legacy centre_id)
        if (cohorteCentresExists && centresExists) {
            const [centres] = await db.query(`
                SELECT c.id, c.nom
                FROM centres c
                JOIN cohorte_centres cc ON c.id = cc.centre_id
                WHERE cc.cohorte_id = ?
            `, [cohorte.id]);
            cohorte.centres = centres;
        } else if (centresExists && cohortesSet.has('centre_id') && cohorte.centre_id) {
            const [centres] = await db.query('SELECT id, nom FROM centres WHERE id = ?', [cohorte.centre_id]);
            cohorte.centres = centres;
        } else {
            cohorte.centres = [];
        }
        cohorte.duree_recrutement = calculateDetailedDuration(cohorte.date_debut_recrutement, cohorte.date_fin_recrutement);
        cohorte.duree_formation = calculateDetailedDuration(cohorte.date_entree_centre, cohorte.date_fin_formation);

        if (cohorte.zones_intervention) {
            cohorte.zones_intervention = safeJsonParse(cohorte.zones_intervention, []);
        }

        // Fetch candidates stats (Placeholder)
        cohorte.candidates_stats = { total: 0, valides: 0 };

        res.json(cohorte);
    } catch (error) {
        console.error('Error fetching cohorte:', error);
        res.status(500).json({
            message: 'Erreur serveur',
            ...(isDev() ? { details: error.message } : {})
        });
    }
});

// POST / - Create (Auto-Code + Multi-Centre)
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            nom, projet_id, centre_ids,
            date_debut_recrutement, date_fin_recrutement,
            date_entree_centre, date_fin_formation,
            location_scope,
            region, departement, sous_prefecture, localite,
            zones_intervention,
            statut
        } = req.body;

        // Validation
        if (!nom || nom.trim() === '') {
            return res.status(400).json({ message: 'Le nom de la cohorte est requis' });
        }

        // Convert projet_id to number or null
        const projetIdNum = projet_id ? parseInt(projet_id, 10) : null;
        if (projet_id && isNaN(projetIdNum)) {
            return res.status(400).json({ message: 'ID de projet invalide' });
        }

        // 1. Generate Automatic Code
        const year = new Date().getFullYear();

        const cohortesExists = await tableExists('cohortes');
        if (!cohortesExists) {
            return res.status(500).json({
                message: 'Erreur lors de la création',
                ...(isDev() ? { error: 'Table cohortes introuvable' } : {})
            });
        }

        const cohortesColumns = await getTableColumns('cohortes');
        const cohortesSet = new Set(cohortesColumns);
        const projectsExists = await tableExists('projects');
        const cohorteCentresExists = await tableExists('cohorte_centres');

        // Get Project Alias/Code (optional)
        let projCode = 'PRJ';
        if (projectsExists && projetIdNum) {
            try {
                const [projRows] = await db.query('SELECT code FROM projects WHERE id = ?', [projetIdNum]);
                projCode = projRows[0]?.code?.substring(0, 3).toUpperCase() || 'PRJ';
            } catch (e) {
                projCode = 'PRJ';
            }
        }

        // Get next sequence only if column exists
        let nextSeq = null;
        if (cohortesSet.has('code_sequence')) {
            const hasCreatedAt = cohortesSet.has('created_at');
            const seqSql = hasCreatedAt
                ? 'SELECT MAX(code_sequence) as max_seq FROM cohortes WHERE projet_id = ? AND YEAR(created_at) = ?'
                : 'SELECT MAX(code_sequence) as max_seq FROM cohortes WHERE projet_id = ?';
            const seqParams = hasCreatedAt ? [projetIdNum, year] : [projetIdNum];
            const [seqRows] = await db.query(seqSql, seqParams);
            nextSeq = (seqRows[0].max_seq || 0) + 1;
        }

        const seqLabel = nextSeq == null ? '01' : String(nextSeq).padStart(2, '0');
        const autoCode = `COH-${year}-${projCode}-${seqLabel}`;

        const formattedNom = nom.charAt(0).toUpperCase() + nom.slice(1);

        // 2. Insert Cohorte (only with existing columns)
        const columns = [];
        const values = [];

        if (cohortesSet.has('nom')) { columns.push('nom'); values.push(formattedNom); }
        if (cohortesSet.has('code')) { columns.push('code'); values.push(autoCode); }
        if (cohortesSet.has('code_sequence') && nextSeq != null) { columns.push('code_sequence'); values.push(nextSeq); }
        if (cohortesSet.has('projet_id')) { columns.push('projet_id'); values.push(projetIdNum); }

        if (cohortesSet.has('date_debut_recrutement')) { columns.push('date_debut_recrutement'); values.push(date_debut_recrutement || null); }
        if (cohortesSet.has('date_fin_recrutement')) { columns.push('date_fin_recrutement'); values.push(date_fin_recrutement || null); }
        if (cohortesSet.has('date_entree_centre')) { columns.push('date_entree_centre'); values.push(date_entree_centre || null); }
        if (cohortesSet.has('date_fin_formation')) { columns.push('date_fin_formation'); values.push(date_fin_formation || null); }

        if (cohortesSet.has('location_scope')) { columns.push('location_scope'); values.push(location_scope || 'GLOBAL'); }
        if (cohortesSet.has('region')) { columns.push('region'); values.push(location_scope === 'SPECIFIC' ? (region || null) : null); }
        if (cohortesSet.has('departement')) { columns.push('departement'); values.push(location_scope === 'SPECIFIC' ? (departement || null) : null); }
        if (cohortesSet.has('sous_prefecture')) { columns.push('sous_prefecture'); values.push(location_scope === 'SPECIFIC' ? (sous_prefecture || null) : null); }
        if (cohortesSet.has('localite')) { columns.push('localite'); values.push(location_scope === 'SPECIFIC' ? (localite || null) : null); }
        if (cohortesSet.has('statut')) { columns.push('statut'); values.push(statut || 'EN_COURS'); }

        if (cohortesSet.has('zones_intervention')) {
            columns.push('zones_intervention');
            values.push(zones_intervention && Array.isArray(zones_intervention) ? JSON.stringify(zones_intervention) : null);
        }

        // Legacy schema: store first centre on cohortes table if no pivot exists
        if (!cohorteCentresExists && cohortesSet.has('centre_id')) {
            const firstCentreId = Array.isArray(centre_ids) ? centre_ids[0] : null;
            columns.push('centre_id');
            values.push(firstCentreId || null);
        }

        if (columns.length === 0) {
            return res.status(500).json({
                message: 'Erreur lors de la création',
                ...(isDev() ? { error: 'Aucune colonne compatible trouvée dans cohortes' } : {})
            });
        }

        const placeholders = columns.map(() => '?').join(', ');
        const [result] = await db.query(
            `INSERT INTO cohortes (${columns.join(', ')}) VALUES (${placeholders})`,
            values
        );

        const cohorteId = result.insertId;

        // 3. Insert Centre Links (pivot schema)
        if (cohorteCentresExists && Array.isArray(centre_ids) && centre_ids.length > 0) {
            // Dédupliquer les centre_ids pour éviter les erreurs de clé primaire
            const uniqueCentreIds = [...new Set(centre_ids)];
            const linkValues = uniqueCentreIds.map(cid => [cohorteId, cid]);
            await db.query('INSERT INTO cohorte_centres (cohorte_id, centre_id) VALUES ?', [linkValues]);
        }

        res.status(201).json({ id: cohorteId, code: autoCode, message: 'Cohorte créée avec succès' });
    } catch (error) {
        console.error('Error creating cohorte:', error);
        res.status(500).json({
            message: 'Erreur lors de la création',
            ...(isDev() ? { error: error.message } : {})
        });
    }
});

// PUT /:id - Update (Protect Code, Update pivot)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const {
            nom, projet_id, centre_ids,
            date_debut_recrutement, date_fin_recrutement,
            date_entree_centre, date_fin_formation,
            location_scope,
            region, departement, sous_prefecture, localite,
            zones_intervention,
            statut
        } = req.body;

        const formattedNom = nom.charAt(0).toUpperCase() + nom.slice(1);

        const cohortesExists = await tableExists('cohortes');
        if (!cohortesExists) return res.status(404).json({ message: 'Cohorte non trouvée' });

        const cohortesColumns = await getTableColumns('cohortes');
        const cohortesSet = new Set(cohortesColumns);
        const cohorteCentresExists = await tableExists('cohorte_centres');

        const setParts = [];
        const params = [];

        if (cohortesSet.has('nom')) { setParts.push('nom = ?'); params.push(formattedNom); }
        if (cohortesSet.has('projet_id')) { setParts.push('projet_id = ?'); params.push(projet_id); }
        if (cohortesSet.has('date_debut_recrutement')) { setParts.push('date_debut_recrutement = ?'); params.push(date_debut_recrutement || null); }
        if (cohortesSet.has('date_fin_recrutement')) { setParts.push('date_fin_recrutement = ?'); params.push(date_fin_recrutement || null); }
        if (cohortesSet.has('date_entree_centre')) { setParts.push('date_entree_centre = ?'); params.push(date_entree_centre || null); }
        if (cohortesSet.has('date_fin_formation')) { setParts.push('date_fin_formation = ?'); params.push(date_fin_formation || null); }
        if (cohortesSet.has('location_scope')) { setParts.push('location_scope = ?'); params.push(location_scope || 'GLOBAL'); }
        if (cohortesSet.has('region')) { setParts.push('region = ?'); params.push(location_scope === 'SPECIFIC' ? (region || null) : null); }
        if (cohortesSet.has('departement')) { setParts.push('departement = ?'); params.push(location_scope === 'SPECIFIC' ? (departement || null) : null); }
        if (cohortesSet.has('sous_prefecture')) { setParts.push('sous_prefecture = ?'); params.push(location_scope === 'SPECIFIC' ? (sous_prefecture || null) : null); }
        if (cohortesSet.has('localite')) { setParts.push('localite = ?'); params.push(location_scope === 'SPECIFIC' ? (localite || null) : null); }
        if (cohortesSet.has('statut')) { setParts.push('statut = ?'); params.push(statut || 'EN_COURS'); }

        if (cohortesSet.has('zones_intervention')) {
            setParts.push('zones_intervention = ?');
            params.push(zones_intervention && Array.isArray(zones_intervention) ? JSON.stringify(zones_intervention) : null);
        }

        if (!cohorteCentresExists && cohortesSet.has('centre_id')) {
            const firstCentreId = Array.isArray(centre_ids) ? centre_ids[0] : null;
            setParts.push('centre_id = ?');
            params.push(firstCentreId || null);
        }

        if (setParts.length > 0) {
            params.push(req.params.id);
            await db.query(`UPDATE cohortes SET ${setParts.join(', ')} WHERE id = ?`, params);
        }

        // 2. Sync Centres (pivot schema)
        if (cohorteCentresExists) {
            await db.query('DELETE FROM cohorte_centres WHERE cohorte_id = ?', [req.params.id]);
            if (Array.isArray(centre_ids) && centre_ids.length > 0) {
                // Dédupliquer les centre_ids pour éviter les erreurs de clé primaire
                const uniqueCentreIds = [...new Set(centre_ids)];
                const linkValues = uniqueCentreIds.map(cid => [req.params.id, cid]);
                await db.query('INSERT INTO cohorte_centres (cohorte_id, centre_id) VALUES ?', [linkValues]);
            }
        }

        res.json({ message: 'Cohorte mise à jour avec succès' });
    } catch (error) {
        console.error('Error updating cohorte:', error);
        res.status(500).json({
            message: 'Erreur lors de la mise à jour',
            ...(isDev() ? { details: error.message } : {})
        });
    }
});

// DELETE /:id - Soft Delete
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const cohortesExists = await tableExists('cohortes');
        if (!cohortesExists) return res.status(404).json({ message: 'Cohorte non trouvée' });

        const cohortesColumns = await getTableColumns('cohortes');
        const cohortesSet = new Set(cohortesColumns);

        if (cohortesSet.has('deleted_at')) {
            await db.query('UPDATE cohortes SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        } else {
            await db.query('DELETE FROM cohortes WHERE id = ?', [req.params.id]);
        }
        res.json({ message: 'Cohorte supprimée avec succès' });
    } catch (error) {
        console.error('Error deleting cohorte:', error);
        res.status(500).json({
            message: 'Erreur lors de la suppression',
            ...(isDev() ? { details: error.message } : {})
        });
    }
});

// GET /export/excel
router.get('/export/excel', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT c.*, p.nom as projet_nom, cnt.nom as centre_nom
            FROM cohortes c
            LEFT JOIN projects p ON c.projet_id = p.id
            LEFT JOIN centres cnt ON c.centre_id = cnt.id
            WHERE c.deleted_at IS NULL
        `;
        const [rows] = await db.query(query);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cohortes');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Nom', key: 'nom', width: 30 },
            { header: 'Code', key: 'code', width: 15 },
            { header: 'Projet', key: 'projet_nom', width: 30 },
            { header: 'Centre', key: 'centre_nom', width: 30 },
            { header: 'Région', key: 'region', width: 20 },
            { header: 'Statut', key: 'statut', width: 15 },
        ];

        rows.forEach(row => worksheet.addRow(row));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=cohortes.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).send('Erreur export');
    }
});

module.exports = router;
