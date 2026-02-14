const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// ============================================================
// GET /stats/overview - Stats globales formations
// ============================================================
router.get('/stats/overview', verifyToken, async (req, res) => {
    try {
        const [statsRows] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN f.statut = 'En formation' THEN 1 ELSE 0 END) as en_formation,
                SUM(CASE WHEN f.statut = 'Abandonné' THEN 1 ELSE 0 END) as abandons,
                SUM(CASE WHEN f.statut = 'Terminé' THEN 1 ELSE 0 END) as termines
            FROM formations f
            WHERE f.deleted_at IS NULL
        `);

        const [projetsCount] = await db.query(`
            SELECT COUNT(DISTINCT f.projet_id) as count
            FROM formations f WHERE f.deleted_at IS NULL AND f.statut = 'En formation'
        `);

        const [cohortesCount] = await db.query(`
            SELECT COUNT(DISTINCT f.cohorte_id) as count
            FROM formations f WHERE f.deleted_at IS NULL AND f.statut = 'En formation'
        `);

        const [centresCount] = await db.query(`
            SELECT COUNT(DISTINCT f.centre_id) as count
            FROM formations f WHERE f.deleted_at IS NULL AND f.statut = 'En formation'
        `);

        // Abandons par motif
        const [abandonsParMotif] = await db.query(`
            SELECT motif_abandon as motif, COUNT(*) as count
            FROM formations
            WHERE deleted_at IS NULL AND statut = 'Abandonné' AND motif_abandon IS NOT NULL
            GROUP BY motif_abandon ORDER BY count DESC LIMIT 6
        `);

        // Durée moyenne en formation (jours)
        const [dureeStats] = await db.query(`
            SELECT
                AVG(DATEDIFF(COALESCE(date_fin_effective, CURDATE()), date_debut)) as duree_moyenne,
                MIN(DATEDIFF(COALESCE(date_fin_effective, CURDATE()), date_debut)) as duree_min,
                MAX(DATEDIFF(COALESCE(date_fin_effective, CURDATE()), date_debut)) as duree_max
            FROM formations WHERE deleted_at IS NULL AND date_debut IS NOT NULL
        `);

        // Formations dont la date fin prévue est dépassée
        const [alertes] = await db.query(`
            SELECT COUNT(*) as count FROM formations
            WHERE deleted_at IS NULL AND statut = 'En formation'
            AND date_fin_prevue IS NOT NULL AND date_fin_prevue < CURDATE()
        `);

        res.json({
            total: statsRows[0].total || 0,
            en_formation: statsRows[0].en_formation || 0,
            abandons: statsRows[0].abandons || 0,
            termines: statsRows[0].termines || 0,
            projets_actifs: projetsCount[0].count || 0,
            cohortes_actives: cohortesCount[0].count || 0,
            centres_actifs: centresCount[0].count || 0,
            abandons_par_motif: abandonsParMotif,
            duree_moyenne: Math.round(dureeStats[0].duree_moyenne || 0),
            alertes_depassement: alertes[0].count || 0
        });
    } catch (error) {
        console.error('Error fetching formation stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// GET /dossier/:candidateId - Dossier complet du candidat
// ============================================================
router.get('/dossier/:candidateId', verifyToken, async (req, res) => {
    try {
        const candidateId = req.params.candidateId;

        // 1. Infos candidat
        const [candidates] = await db.query(`
            SELECT c.*,
                   p.nom as projet_nom, p.code as projet_code,
                   co.nom as cohorte_nom, co.code as cohorte_code,
                   ce.nom as centre_nom
            FROM candidates c
            LEFT JOIN projects p ON c.projet_id = p.id
            LEFT JOIN cohortes co ON c.cohorte_id = co.id
            LEFT JOIN centres ce ON co.centre_id = ce.id
            WHERE c.id = ?
        `, [candidateId]);

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidat non trouvé' });
        }

        const candidate = candidates[0];

        // 2. Logs de validation (audit)
        const [validationLogs] = await db.query(`
            SELECT * FROM audit_logs
            WHERE entity_type = 'candidate' AND entity_id = ? AND action LIKE '%valid%'
            ORDER BY created_at ASC
        `, [candidateId]).catch(() => [[]]);

        // 3. Visite médicale
        const [visites] = await db.query(`
            SELECT vm.*, u.nom as createur_nom, u.prenom as createur_prenom
            FROM visites_medicales vm
            LEFT JOIN users u ON vm.created_by = u.id
            WHERE vm.candidate_id = ? AND vm.deleted_at IS NULL
            ORDER BY vm.date_visite DESC
        `, [candidateId]);

        // 4. Formation
        const [formations] = await db.query(`
            SELECT f.*,
                   co.nom as cohorte_nom, ce.nom as centre_nom, p.nom as projet_nom
            FROM formations f
            LEFT JOIN cohortes co ON f.cohorte_id = co.id
            LEFT JOIN centres ce ON f.centre_id = ce.id
            LEFT JOIN projects p ON f.projet_id = p.id
            WHERE f.candidate_id = ? AND f.deleted_at IS NULL
            ORDER BY f.date_debut DESC
        `, [candidateId]);

        // 5. Stages
        const [stages] = await db.query(`
            SELECT s.*, e.nom as entreprise_nom, e.secteur_activite
            FROM stages s
            LEFT JOIN entreprises e ON s.entreprise_id = e.id
            WHERE s.candidate_id = ? AND s.deleted_at IS NULL
            ORDER BY s.date_debut DESC
        `, [candidateId]);

        res.json({
            candidate,
            validation_logs: validationLogs,
            visites_medicales: visites,
            formations,
            stages
        });
    } catch (error) {
        console.error('Error fetching dossier:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// GET / - Liste formations avec filtres et pagination
// ============================================================
router.get('/', verifyToken, async (req, res) => {
    try {
        const { search, statut, projet_id, cohorte_id, centre_id, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let where = 'WHERE f.deleted_at IS NULL';
        const params = [];

        if (statut) {
            where += ' AND f.statut = ?';
            params.push(statut);
        }
        if (projet_id) {
            where += ' AND f.projet_id = ?';
            params.push(projet_id);
        }
        if (cohorte_id) {
            where += ' AND f.cohorte_id = ?';
            params.push(cohorte_id);
        }
        if (centre_id) {
            where += ' AND f.centre_id = ?';
            params.push(centre_id);
        }
        if (search) {
            where += ' AND (c.nom LIKE ? OR c.prenom LIKE ? OR c.telephone LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        // Count
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total FROM formations f
             LEFT JOIN candidates c ON f.candidate_id = c.id
             ${where}`,
            params
        );

        // Data
        const [formations] = await db.query(
            `SELECT f.*,
                    c.nom as candidate_nom, c.prenom as candidate_prenom,
                    c.telephone, c.email, c.metier_choisi, c.photo,
                    c.statut as candidate_statut, c.age,
                    co.nom as cohorte_nom, co.code as cohorte_code,
                    ce.nom as centre_nom,
                    p.nom as projet_nom, p.code as projet_code
             FROM formations f
             LEFT JOIN candidates c ON f.candidate_id = c.id
             LEFT JOIN cohortes co ON f.cohorte_id = co.id
             LEFT JOIN centres ce ON f.centre_id = ce.id
             LEFT JOIN projects p ON f.projet_id = p.id
             ${where}
             ORDER BY f.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            data: formations,
            pagination: {
                total: countRows[0].total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countRows[0].total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching formations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// GET /:id - Détail formation
// ============================================================
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [formations] = await db.query(`
            SELECT f.*,
                   c.nom as candidate_nom, c.prenom as candidate_prenom,
                   c.telephone, c.email, c.metier_choisi, c.photo, c.age,
                   c.sexe, c.date_naissance, c.region, c.ville,
                   co.nom as cohorte_nom, co.code as cohorte_code,
                   ce.nom as centre_nom,
                   p.nom as projet_nom, p.code as projet_code
            FROM formations f
            LEFT JOIN candidates c ON f.candidate_id = c.id
            LEFT JOIN cohortes co ON f.cohorte_id = co.id
            LEFT JOIN centres ce ON f.centre_id = ce.id
            LEFT JOIN projects p ON f.projet_id = p.id
            WHERE f.id = ? AND f.deleted_at IS NULL
        `, [req.params.id]);

        if (formations.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }

        res.json(formations[0]);
    } catch (error) {
        console.error('Error fetching formation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// POST / - Créer formation + passer candidat en "En formation"
// ============================================================
router.post('/', verifyToken, async (req, res) => {
    try {
        const { candidate_id, cohorte_id, centre_id, projet_id, date_debut, date_fin_prevue, observations } = req.body;

        if (!candidate_id || !date_debut) {
            return res.status(400).json({ error: 'candidate_id et date_debut sont requis' });
        }

        // Vérifier que le candidat existe et est Apte
        const [candidates] = await db.query('SELECT id, statut FROM candidates WHERE id = ?', [candidate_id]);
        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidat non trouvé' });
        }
        if (candidates[0].statut !== 'Apte' && candidates[0].statut !== 'En formation') {
            return res.status(400).json({ error: `Le candidat doit être au statut "Apte". Statut actuel: ${candidates[0].statut}` });
        }

        // Vérifier qu'il n'a pas déjà une formation active
        const [existing] = await db.query(
            "SELECT id FROM formations WHERE candidate_id = ? AND statut = 'En formation' AND deleted_at IS NULL",
            [candidate_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Ce candidat a déjà une formation en cours' });
        }

        const [result] = await db.query(
            `INSERT INTO formations (candidate_id, cohorte_id, centre_id, projet_id, date_debut, date_fin_prevue, observations, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [candidate_id, cohorte_id || null, centre_id || null, projet_id || null, date_debut, date_fin_prevue || null, observations || null, req.user.id]
        );

        // Mettre à jour le statut du candidat
        await db.query("UPDATE candidates SET statut = 'En formation' WHERE id = ?", [candidate_id]);

        res.status(201).json({ id: result.insertId, message: 'Formation créée avec succès' });
    } catch (error) {
        console.error('Error creating formation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// POST /bulk - Inscription en masse (tous les Apte d'une cohorte)
// ============================================================
router.post('/bulk', verifyToken, async (req, res) => {
    try {
        const { cohorte_id, date_debut } = req.body;

        if (!cohorte_id || !date_debut) {
            return res.status(400).json({ error: 'cohorte_id et date_debut sont requis' });
        }

        // Chercher tous les candidats Apte de cette cohorte
        const [candidates] = await db.query(
            `SELECT c.id, c.projet_id, c.cohorte_id, co.centre_id
             FROM candidates c
             LEFT JOIN cohortes co ON c.cohorte_id = co.id
             WHERE c.statut = 'Apte' AND c.cohorte_id = ?`,
            [cohorte_id]
        );

        if (candidates.length === 0) {
            return res.status(400).json({ error: 'Aucun candidat Apte trouvé dans cette cohorte' });
        }

        // Filtrer ceux qui n'ont pas déjà une formation active
        const [existing] = await db.query(
            `SELECT candidate_id FROM formations WHERE statut = 'En formation' AND deleted_at IS NULL AND candidate_id IN (?)`,
            [candidates.map(c => c.id)]
        );
        const existingIds = new Set(existing.map(e => e.candidate_id));
        const toInsert = candidates.filter(c => !existingIds.has(c.id));

        if (toInsert.length === 0) {
            return res.status(400).json({ error: 'Tous les candidats Apte ont déjà une formation active' });
        }

        let inserted = 0;
        for (const c of toInsert) {
            await db.query(
                `INSERT INTO formations (candidate_id, cohorte_id, centre_id, projet_id, date_debut, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [c.id, cohorte_id, c.centre_id || null, c.projet_id || null, date_debut, req.user.id]
            );
            await db.query("UPDATE candidates SET statut = 'En formation' WHERE id = ?", [c.id]);
            inserted++;
        }

        res.status(201).json({ message: `${inserted} candidate(s) inscrite(s) en formation`, count: inserted });
    } catch (error) {
        console.error('Error bulk creating formations:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// PUT /:id - Modifier formation
// ============================================================
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { date_debut, date_fin_prevue, observations } = req.body;

        await db.query(
            `UPDATE formations SET date_debut = COALESCE(?, date_debut),
             date_fin_prevue = COALESCE(?, date_fin_prevue),
             observations = COALESCE(?, observations)
             WHERE id = ? AND deleted_at IS NULL`,
            [date_debut, date_fin_prevue, observations, req.params.id]
        );

        res.json({ message: 'Formation mise à jour' });
    } catch (error) {
        console.error('Error updating formation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// PUT /:id/abandon - Enregistrer abandon
// ============================================================
router.put('/:id/abandon', verifyToken, async (req, res) => {
    try {
        const { date_abandon, motif_abandon, details_abandon, circonstances_abandon, signale_par } = req.body;

        if (!date_abandon || !motif_abandon) {
            return res.status(400).json({ error: 'date_abandon et motif_abandon sont requis' });
        }

        // Récupérer la formation
        const [formations] = await db.query(
            "SELECT * FROM formations WHERE id = ? AND deleted_at IS NULL",
            [req.params.id]
        );
        if (formations.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        if (formations[0].statut !== 'En formation') {
            return res.status(400).json({ error: 'Seule une formation en cours peut être marquée comme abandonnée' });
        }

        // Mettre à jour la formation
        await db.query(
            `UPDATE formations SET
                statut = 'Abandonné',
                date_abandon = ?,
                date_fin_effective = ?,
                motif_abandon = ?,
                details_abandon = ?,
                circonstances_abandon = ?,
                signale_par = ?
             WHERE id = ?`,
            [date_abandon, date_abandon, motif_abandon, details_abandon || null, circonstances_abandon || null, signale_par || null, req.params.id]
        );

        // Mettre à jour le statut du candidat
        await db.query("UPDATE candidates SET statut = 'Abandonné' WHERE id = ?", [formations[0].candidate_id]);

        res.json({ message: 'Abandon enregistré avec succès' });
    } catch (error) {
        console.error('Error recording abandon:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// PUT /:id/terminer - Marquer formation terminée
// ============================================================
router.put('/:id/terminer', verifyToken, async (req, res) => {
    try {
        const { date_fin_effective, observations } = req.body;

        const [formations] = await db.query(
            "SELECT * FROM formations WHERE id = ? AND deleted_at IS NULL",
            [req.params.id]
        );
        if (formations.length === 0) {
            return res.status(404).json({ error: 'Formation non trouvée' });
        }
        if (formations[0].statut !== 'En formation') {
            return res.status(400).json({ error: 'Seule une formation en cours peut être terminée' });
        }

        await db.query(
            `UPDATE formations SET
                statut = 'Terminé',
                date_fin_effective = ?,
                observations = COALESCE(?, observations)
             WHERE id = ?`,
            [date_fin_effective || new Date().toISOString().split('T')[0], observations, req.params.id]
        );

        // Mettre à jour le statut du candidat
        await db.query("UPDATE candidates SET statut = 'Terminé' WHERE id = ?", [formations[0].candidate_id]);

        res.json({ message: 'Formation terminée avec succès' });
    } catch (error) {
        console.error('Error completing formation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================================
// DELETE /:id - Soft delete
// ============================================================
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await db.query('UPDATE formations SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        res.json({ message: 'Formation supprimée' });
    } catch (error) {
        console.error('Error deleting formation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
