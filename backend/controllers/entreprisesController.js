const db = require('../config/db');

// Générer un code unique pour l'entreprise
const generateEntrepriseCode = async () => {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM entreprises');
    const count = rows[0].count + 1;
    return `ENT-${String(count).padStart(4, '0')}`;
};

// GET /api/entreprises - Liste toutes les entreprises avec filtres
exports.getAll = async (req, res) => {
    try {
        const { search, secteur_activite, region, statut } = req.query;
        let query = 'SELECT * FROM entreprises WHERE deleted_at IS NULL';
        const params = [];

        if (search) {
            query += ' AND (nom LIKE ? OR code LIKE ? OR ville LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (secteur_activite) {
            query += ' AND secteur_activite = ?';
            params.push(secteur_activite);
        }
        if (region) {
            query += ' AND region = ?';
            params.push(region);
        }
        if (statut) {
            query += ' AND statut = ?';
            params.push(statut);
        }

        query += ' ORDER BY created_at DESC';

        const [entreprises] = await db.query(query, params);

        // Enrichir avec le nombre de stages
        for (const entreprise of entreprises) {
            const [stagesCount] = await db.query(
                'SELECT COUNT(*) as total FROM stages WHERE entreprise_id = ? AND deleted_at IS NULL',
                [entreprise.id]
            );
            entreprise.nb_stages = stagesCount[0].total;

            const [stagesActifs] = await db.query(
                'SELECT COUNT(*) as total FROM stages WHERE entreprise_id = ? AND statut = ? AND deleted_at IS NULL',
                [entreprise.id, 'En cours']
            );
            entreprise.nb_stages_actifs = stagesActifs[0].total;
        }

        res.json(entreprises);
    } catch (error) {
        console.error('Error fetching entreprises:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des entreprises' });
    }
};

// GET /api/entreprises/:id - Détails d'une entreprise
exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM entreprises WHERE id = ? AND deleted_at IS NULL',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        const entreprise = rows[0];

        // Parse JSON fields
        if (entreprise.metiers_proposes && typeof entreprise.metiers_proposes === 'string') {
            try {
                entreprise.metiers_proposes = JSON.parse(entreprise.metiers_proposes);
            } catch (e) {
                entreprise.metiers_proposes = [];
            }
        }

        // Charger les stages associés
        const [stages] = await db.query(
            `SELECT s.*, c.nom as candidate_nom, c.prenom as candidate_prenom
             FROM stages s
             LEFT JOIN candidates c ON s.candidate_id = c.id
             WHERE s.entreprise_id = ? AND s.deleted_at IS NULL
             ORDER BY s.date_debut DESC`,
            [entreprise.id]
        );
        entreprise.stages = stages;

        // Statistiques
        entreprise.stats = {
            total_stages: stages.length,
            stages_en_cours: stages.filter(s => s.statut === 'En cours').length,
            stages_termines: stages.filter(s => s.statut === 'Terminé').length,
            taux_presence_moyen: stages.length > 0
                ? stages.reduce((acc, s) => acc + (parseFloat(s.taux_presence) || 0), 0) / stages.length
                : 0
        };

        res.json(entreprise);
    } catch (error) {
        console.error('Error fetching entreprise:', error);
        res.status(500).json({ error: 'Erreur lors du chargement de l\'entreprise' });
    }
};

// POST /api/entreprises - Créer une nouvelle entreprise
exports.create = async (req, res) => {
    try {
        const {
            nom, secteur_activite, adresse, region, ville,
            telephone, telephone_2, email,
            responsable_nom, responsable_fonction, responsable_contact, responsable_email,
            capacite_stagiaires_max, metiers_proposes,
            type_partenariat, date_convention, duree_convention_mois, conditions_partenariat,
            description
        } = req.body;

        // Validation
        if (!nom) {
            return res.status(400).json({ error: 'Le nom de l\'entreprise est requis' });
        }

        // Générer le code
        const code = await generateEntrepriseCode();

        // Préparer metiers_proposes en JSON
        const metiersProposes = Array.isArray(metiers_proposes)
            ? JSON.stringify(metiers_proposes)
            : metiers_proposes || null;

        const [result] = await db.query(
            `INSERT INTO entreprises (
                code, nom, secteur_activite, adresse, region, ville,
                telephone, telephone_2, email,
                responsable_nom, responsable_fonction, responsable_contact, responsable_email,
                capacite_stagiaires_max, metiers_proposes,
                type_partenariat, date_convention, duree_convention_mois, conditions_partenariat,
                description, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code, nom, secteur_activite, adresse, region, ville,
                telephone, telephone_2, email,
                responsable_nom, responsable_fonction, responsable_contact, responsable_email,
                capacite_stagiaires_max, metiersProposes,
                type_partenariat, date_convention, duree_convention_mois, conditions_partenariat,
                description, req.user?.id || null
            ]
        );

        const [newEntreprise] = await db.query('SELECT * FROM entreprises WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Entreprise créée avec succès',
            entreprise: newEntreprise[0]
        });
    } catch (error) {
        console.error('Error creating entreprise:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'entreprise' });
    }
};

// PUT /api/entreprises/:id - Mettre à jour une entreprise
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Vérifier que l'entreprise existe
        const [existing] = await db.query(
            'SELECT * FROM entreprises WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        // Préparer metiers_proposes en JSON si présent
        if (updates.metiers_proposes && Array.isArray(updates.metiers_proposes)) {
            updates.metiers_proposes = JSON.stringify(updates.metiers_proposes);
        }

        // Construire la requête dynamiquement
        const fields = Object.keys(updates).filter(key => key !== 'id');
        const values = fields.map(field => updates[field]);

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        await db.query(
            `UPDATE entreprises SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        const [updated] = await db.query('SELECT * FROM entreprises WHERE id = ?', [id]);

        res.json({
            message: 'Entreprise mise à jour avec succès',
            entreprise: updated[0]
        });
    } catch (error) {
        console.error('Error updating entreprise:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'entreprise' });
    }
};

// DELETE /api/entreprises/:id - Soft delete d'une entreprise
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que l'entreprise existe
        const [existing] = await db.query(
            'SELECT * FROM entreprises WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        // Vérifier s'il y a des stages en cours
        const [stagesActifs] = await db.query(
            'SELECT COUNT(*) as count FROM stages WHERE entreprise_id = ? AND statut = ? AND deleted_at IS NULL',
            [id, 'En cours']
        );

        if (stagesActifs[0].count > 0) {
            return res.status(400).json({
                error: 'Impossible de supprimer une entreprise avec des stages en cours'
            });
        }

        // Soft delete
        await db.query('UPDATE entreprises SET deleted_at = NOW() WHERE id = ?', [id]);

        res.json({ message: 'Entreprise supprimée avec succès' });
    } catch (error) {
        console.error('Error deleting entreprise:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'entreprise' });
    }
};

// GET /api/entreprises/:id/stages - Stages d'une entreprise
exports.getStages = async (req, res) => {
    try {
        const [stages] = await db.query(
            `SELECT s.*, c.nom as candidate_nom, c.prenom as candidate_prenom, c.photo
             FROM stages s
             LEFT JOIN candidates c ON s.candidate_id = c.id
             WHERE s.entreprise_id = ? AND s.deleted_at IS NULL
             ORDER BY s.date_debut DESC`,
            [req.params.id]
        );

        res.json(stages);
    } catch (error) {
        console.error('Error fetching stages:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des stages' });
    }
};

// GET /api/entreprises/:id/statistiques - Statistiques d'une entreprise
exports.getStatistiques = async (req, res) => {
    try {
        const [entreprise] = await db.query(
            'SELECT * FROM entreprises WHERE id = ? AND deleted_at IS NULL',
            [req.params.id]
        );

        if (entreprise.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        const [stages] = await db.query(
            'SELECT * FROM stages WHERE entreprise_id = ? AND deleted_at IS NULL',
            [req.params.id]
        );

        const stats = {
            total_stages: stages.length,
            stages_en_cours: stages.filter(s => s.statut === 'En cours').length,
            stages_planifies: stages.filter(s => s.statut === 'Planifié').length,
            stages_termines: stages.filter(s => s.statut === 'Terminé').length,
            stages_abandonnes: stages.filter(s => s.statut === 'Abandonné').length,

            note_moyenne_entreprise: stages.length > 0
                ? stages.reduce((acc, s) => acc + (parseFloat(s.note_entreprise) || 0), 0) / stages.filter(s => s.note_entreprise).length
                : 0,

            taux_presence_moyen: stages.length > 0
                ? stages.reduce((acc, s) => acc + (parseFloat(s.taux_presence) || 0), 0) / stages.filter(s => s.taux_presence).length
                : 0,

            taux_reussite: entreprise[0].taux_reussite || 0,
            nombre_stagiaires_accueillis: entreprise[0].nombre_stagiaires_accueillis || 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching statistiques:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des statistiques' });
    }
};

// GET /api/entreprises/secteur/:secteur - Entreprises par secteur
exports.getBySecteur = async (req, res) => {
    try {
        const [entreprises] = await db.query(
            'SELECT * FROM entreprises WHERE secteur_activite = ? AND deleted_at IS NULL ORDER BY nom',
            [req.params.secteur]
        );

        res.json(entreprises);
    } catch (error) {
        console.error('Error fetching entreprises by secteur:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des entreprises' });
    }
};
