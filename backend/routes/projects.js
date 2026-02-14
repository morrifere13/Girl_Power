const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../config/multer');
const { verifyToken } = require('../middleware/authMiddleware');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Helper to calculate duration in months
const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    months -= startDate.getMonth();
    months += endDate.getMonth();
    return months <= 0 ? 0 : months;
};

// Generate next Project Code (e.g. PRJ-2026-001)
const generateProjectCode = async (connection) => {
    const year = new Date().getFullYear();
    const [rows] = await connection.query(
        "SELECT COUNT(*) as count FROM projects WHERE code LIKE ?",
        [`PRJ-${year}-%`]
    );
    const count = rows[0].count + 1;
    return `PRJ-${year}-${String(count).padStart(3, '0')}`;
};

// GET All Projects (with optional filters)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { statut, genre_cible, date_debut_min, date_debut_max, region } = req.query;

        let query = 'SELECT * FROM projects WHERE deleted_at IS NULL';
        const params = [];

        if (statut) {
            query += ' AND statut = ?';
            params.push(statut);
        }
        if (genre_cible) {
            query += ' AND genre_cible = ?';
            params.push(genre_cible);
        }
        if (date_debut_min) {
            query += ' AND date_debut >= ?';
            params.push(date_debut_min);
        }
        if (date_debut_max) {
            query += ' AND date_debut <= ?';
            params.push(date_debut_max);
        }
        if (region) {
            query += ' AND JSON_CONTAINS(zones_intervention, JSON_QUOTE(?), "$.regions")';
            params.push(region);
        }

        query += ' ORDER BY created_at DESC';

        const [projects] = await db.query(query, params);

        const formattedProjects = projects.map(p => ({
            ...p,
            nom: p.nom ? p.nom.toUpperCase() : '',
            bailleurs: typeof p.bailleurs === 'string' ? JSON.parse(p.bailleurs) : p.bailleurs,
            partenaires: typeof p.partenaires === 'string' ? JSON.parse(p.partenaires) : p.partenaires,
            avantages: typeof p.avantages === 'string' ? JSON.parse(p.avantages) : p.avantages,
            criteres_admission: typeof p.criteres_admission === 'string' ? JSON.parse(p.criteres_admission) : p.criteres_admission,
            zones_intervention: typeof p.zones_intervention === 'string' ? JSON.parse(p.zones_intervention) : p.zones_intervention,
            pays_cible: typeof p.pays_cible === 'string' ? JSON.parse(p.pays_cible) : p.pays_cible,
        }));

        res.json(formattedProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Erreur chargement projets' });
    }
});

// GET Project by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [projects] = await db.query('SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL', [req.params.id]);

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Projet non trouvé' });
        }

        const project = projects[0];

        // Load linked centres
        const [centres] = await db.query(`
            SELECT c.id, c.nom, c.code 
            FROM centres c
            JOIN project_centres pc ON c.id = pc.centre_id
            WHERE pc.project_id = ?
        `, [project.id]);

        // Load project documents
        const [documents] = await db.query('SELECT * FROM project_documents WHERE project_id = ?', [project.id]);

        const formattedProject = {
            ...project,
            nom: project.nom ? project.nom.toUpperCase() : '',
            bailleurs: typeof project.bailleurs === 'string' ? JSON.parse(project.bailleurs) : project.bailleurs,
            partenaires: typeof project.partenaires === 'string' ? JSON.parse(project.partenaires) : project.partenaires,
            avantages: typeof project.avantages === 'string' ? JSON.parse(project.avantages) : project.avantages,
            criteres_admission: typeof project.criteres_admission === 'string' ? JSON.parse(project.criteres_admission) : project.criteres_admission,
            zones_intervention: typeof project.zones_intervention === 'string' ? JSON.parse(project.zones_intervention) : project.zones_intervention,
            pays_cible: typeof project.pays_cible === 'string' ? JSON.parse(project.pays_cible) : project.pays_cible,
            centres: centres,
            documents: documents
        };

        res.json(formattedProject);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ error: 'Erreur chargement projet' });
    }
});

// Export to Excel
router.get('/export/excel', verifyToken, async (req, res) => {
    try {
        const [projects] = await db.query('SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Projets');

        worksheet.columns = [
            { header: 'Code', key: 'code', width: 15 },
            { header: 'Nom', key: 'nom', width: 40 },
            { header: 'Statut', key: 'statut', width: 15 },
            { header: 'Date Début', key: 'date_debut', width: 15 },
            { header: 'Date Fin', key: 'date_fin', width: 15 },
            { header: 'Durée (mois)', key: 'duree_mois', width: 12 },
            { header: 'Genre Cible', key: 'genre_cible', width: 12 },
            { header: 'Cible Quantitative', key: 'cible_quantitative', width: 18 },
            { header: 'Objectif Insertion (%)', key: 'objectif_reclassement', width: 20 },
        ];

        projects.forEach(project => {
            worksheet.addRow({
                code: project.code,
                nom: project.nom,
                statut: project.statut,
                date_debut: project.date_debut ? new Date(project.date_debut).toLocaleDateString('fr-FR') : '',
                date_fin: project.date_fin ? new Date(project.date_fin).toLocaleDateString('fr-FR') : '',
                duree_mois: project.duree_mois,
                genre_cible: project.genre_cible,
                cible_quantitative: project.cible_quantitative,
                objectif_reclassement: project.objectif_reclassement,
            });
        });

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=projets_${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({ error: 'Erreur export Excel' });
    }
});

// Export to PDF
router.get('/export/pdf', verifyToken, async (req, res) => {
    try {
        const [projects] = await db.query('SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC');

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=projets_${Date.now()}.pdf`);

        doc.pipe(res);

        // Title
        doc.fontSize(20).font('Helvetica-Bold').text('Liste des Projets', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
        doc.moveDown(2);

        // Projects
        projects.forEach((project, index) => {
            if (index > 0) doc.moveDown();

            doc.fontSize(12).font('Helvetica-Bold').text(project.nom || 'Sans nom');
            doc.fontSize(9).font('Helvetica')
                .text(`Code: ${project.code} | Statut: ${project.statut || 'N/A'}`)
                .text(`Période: ${project.date_debut ? new Date(project.date_debut).toLocaleDateString('fr-FR') : 'N/A'} - ${project.date_fin ? new Date(project.date_fin).toLocaleDateString('fr-FR') : 'N/A'}`)
                .text(`Durée: ${project.duree_mois} mois | Cible: ${project.cible_quantitative} personnes`);

            doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
            doc.moveDown(0.5);

            if (doc.y > 700) {
                doc.addPage();
            }
        });

        doc.end();
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        res.status(500).json({ error: 'Erreur export PDF' });
    }
});

// Import from Excel
router.post('/import/excel', verifyToken, upload.single('file'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        await connection.beginTransaction();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1);

        const imported = [];
        const errors = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            try {
                const nom = row.getCell(1).value;
                const date_debut = row.getCell(2).value;
                const date_fin = row.getCell(3).value;
                const description = row.getCell(4).value || '';
                const statut = row.getCell(5).value || 'PLANIFIE';

                if (!nom || !date_debut || !date_fin) {
                    errors.push({ row: rowNumber, error: 'Champs obligatoires manquants' });
                    return;
                }

                imported.push({ nom, date_debut, date_fin, description, statut });
            } catch (err) {
                errors.push({ row: rowNumber, error: err.message });
            }
        });

        // Insert projects
        for (const project of imported) {
            const code = await generateProjectCode(connection);
            const duree_mois = calculateDuration(project.date_debut, project.date_fin);

            await connection.query(`
                INSERT INTO projects (code, nom, date_debut, date_fin, duree_mois, description, statut, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [code, project.nom.toUpperCase(), project.date_debut, project.date_fin, duree_mois, project.description, project.statut, req.user.id]);
        }

        await connection.commit();
        res.json({
            success: true,
            imported: imported.length,
            errors: errors.length,
            details: errors
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error importing Excel:', error);
        res.status(500).json({ error: 'Erreur import Excel' });
    } finally {
        connection.release();
    }
});

// Configure Multer fields
const projectUploads = upload.fields([
    { name: 'convention', maxCount: 1 },
    { name: 'tdr', maxCount: 1 },
    { name: 'rapports', maxCount: 10 }
]);

// POST Create Project
router.post('/', verifyToken, projectUploads, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            nom, date_debut, date_fin, description,
            bailleurs, partenaires, avantages, criteres_admission, zones_intervention,
            centre_ids, cible_quantitative, objectif_reclassement, taux_abandon_max,
            genre_cible, pays_cible
        } = req.body;

        // Auto-generate code
        const code = await generateProjectCode(connection);

        // Upper case nom
        const nomUpper = nom ? nom.toUpperCase() : 'NOUVEAU PROJET';

        const duree_mois = calculateDuration(date_debut, date_fin);

        // Handle files
        const conventionPath = req.files['convention'] ? `/uploads/${req.files['convention'][0].filename}` : null;
        const tdrPath = req.files['tdr'] ? `/uploads/${req.files['tdr'][0].filename}` : null;

        const [result] = await connection.query(`
            INSERT INTO projects (
                code, nom, date_debut, date_fin, duree_mois, description,
                bailleurs, partenaires, avantages, criteres_admission, zones_intervention,
                cible_quantitative, objectif_reclassement, taux_abandon_max,
                convention_url, tdr_url,
                created_by, genre_cible, pays_cible
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            code, nomUpper, date_debut, date_fin, duree_mois, description,
            bailleurs || '[]',
            partenaires || '[]',
            avantages || '[]',
            criteres_admission || '{}',
            zones_intervention || '{}',
            cible_quantitative || 0,
            objectif_reclassement || 0,
            taux_abandon_max || 0,
            conventionPath,
            tdrPath,
            req.user.id,
            genre_cible || 'MIXTE',
            pays_cible || '[]'
        ]);

        const projectId = result.insertId;

        // Link Centres
        if (centre_ids) {
            let ids = [];
            try {
                ids = Array.isArray(centre_ids) ? centre_ids : JSON.parse(centre_ids);
            } catch (e) { console.log('Param parse error', e); ids = []; }

            if (ids.length > 0) {
                const values = ids.map(cid => [projectId, cid]);
                await connection.query(
                    'INSERT INTO project_centres (project_id, centre_id) VALUES ?',
                    [values]
                );
            }
        }

        // Handle Report Files
        if (req.files['rapports']) {
            for (const file of req.files['rapports']) {
                await connection.query(
                    'INSERT INTO project_documents (project_id, type_doc, nom_fichier, chemin_fichier) VALUES (?, ?, ?, ?)',
                    [projectId, 'RAPPORT', file.originalname, `/uploads/${file.filename}`]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Projet créé', id: projectId, code: code });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating project:', error);
        res.status(500).json({ error: error.message || 'Erreur création projet' });
    } finally {
        connection.release();
    }
});

// PUT Update Project
router.put('/:id', verifyToken, projectUploads, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            nom, date_debut, date_fin, description,
            bailleurs, partenaires, avantages, criteres_admission, zones_intervention,
            centre_ids, statut, cible_quantitative, objectif_reclassement, taux_abandon_max,
            genre_cible, pays_cible
        } = req.body;

        const duree_mois = calculateDuration(date_debut, date_fin);
        const nomUpper = nom ? nom.toUpperCase() : '';

        // Build simple update query - Files are updated only if provided
        let query = `
            UPDATE projects SET
                nom=?, date_debut=?, date_fin=?, duree_mois=?, description=?,
                bailleurs=?, partenaires=?, avantages=?, criteres_admission=?, zones_intervention=?,
                statut=?, cible_quantitative=?, objectif_reclassement=?, taux_abandon_max=?,
                genre_cible=?, pays_cible=?
        `;
        const params = [
            nomUpper, date_debut, date_fin, duree_mois, description,
            bailleurs || '[]',
            partenaires || '[]',
            avantages || '[]',
            criteres_admission || '{}',
            zones_intervention || '{}',
            statut,
            cible_quantitative || 0,
            objectif_reclassement || 0,
            taux_abandon_max || 0,
            genre_cible,
            pays_cible || '[]'
        ];

        if (req.files['convention']) {
            query += `, convention_url=?`;
            params.push(`/uploads/${req.files['convention'][0].filename}`);
        }
        if (req.files['tdr']) {
            query += `, tdr_url=?`;
            params.push(`/uploads/${req.files['tdr'][0].filename}`);
        }

        query += ` WHERE id=?`;
        params.push(req.params.id);

        await connection.query(query, params);

        // Update Centres Links
        await connection.query('DELETE FROM project_centres WHERE project_id = ?', [req.params.id]);
        if (centre_ids) {
            let ids = [];
            try {
                ids = Array.isArray(centre_ids) ? centre_ids : JSON.parse(centre_ids);
            } catch (e) { console.log('Param parse error', e); ids = []; }

            if (ids.length > 0) {
                const values = ids.map(cid => [req.params.id, cid]);
                await connection.query(
                    'INSERT INTO project_centres (project_id, centre_id) VALUES ?',
                    [values]
                );
            }
        }

        // Add new reports
        if (req.files['rapports']) {
            for (const file of req.files['rapports']) {
                await connection.query(
                    'INSERT INTO project_documents (project_id, type_doc, nom_fichier, chemin_fichier) VALUES (?, ?, ?, ?)',
                    [req.params.id, 'RAPPORT', file.originalname, `/uploads/${file.filename}`]
                );
            }
        }

        await connection.commit();
        res.json({ message: 'Projet mis à jour' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating project:', error);
        res.status(500).json({ error: 'Erreur mise à jour projet' });
    } finally {
        connection.release();
    }
});

// DELETE Project
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await db.query('UPDATE projects SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        res.json({ message: 'Projet supprimé' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ error: 'Erreur suppression projet' });
    }
});

module.exports = router;
