const db = require('../config/db');

// Générer un code unique pour le stage
const generateStageCode = async () => {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM stages');
    const count = rows[0].count + 1;
    const year = new Date().getFullYear();
    return `STG-${year}-${String(count).padStart(4, '0')}`;
};

// GET /api/stages - Liste tous les stages avec filtres
exports.getAll = async (req, res) => {
    try {
        const { search, statut, type_stage, entreprise_id, candidate_id, cohorte_id } = req.query;
        let query = `
            SELECT s.*,
                   c.nom as candidate_nom, c.prenom as candidate_prenom, c.photo as candidate_photo,
                   e.nom as entreprise_nom, e.secteur_activite
            FROM stages s
            LEFT JOIN candidates c ON s.candidate_id = c.id
            LEFT JOIN entreprises e ON s.entreprise_id = e.id
            WHERE s.deleted_at IS NULL
        `;
        const params = [];

        if (search) {
            query += ' AND (s.code LIKE ? OR c.nom LIKE ? OR c.prenom LIKE ? OR e.nom LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (statut) {
            query += ' AND s.statut = ?';
            params.push(statut);
        }
        if (type_stage) {
            query += ' AND s.type_stage = ?';
            params.push(type_stage);
        }
        if (entreprise_id) {
            query += ' AND s.entreprise_id = ?';
            params.push(entreprise_id);
        }
        if (candidate_id) {
            query += ' AND s.candidate_id = ?';
            params.push(candidate_id);
        }
        if (cohorte_id) {
            query += ' AND s.cohorte_id = ?';
            params.push(cohorte_id);
        }

        query += ' ORDER BY s.date_debut DESC';

        const [stages] = await db.query(query, params);

        // Enrichir avec les évaluations
        for (const stage of stages) {
            const [evaluations] = await db.query(
                'SELECT COUNT(*) as total FROM stage_evaluations WHERE stage_id = ?',
                [stage.id]
            );
            stage.nb_evaluations = evaluations[0].total;

            // Parse JSON fields
            if (stage.competences_acquises && typeof stage.competences_acquises === 'string') {
                try {
                    stage.competences_acquises = JSON.parse(stage.competences_acquises);
                } catch (e) {
                    stage.competences_acquises = [];
                }
            }
        }

        res.json(stages);
    } catch (error) {
        console.error('Error fetching stages:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des stages' });
    }
};

// GET /api/stages/:id - Détails d'un stage
exports.getById = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT s.*,
                    c.nom as candidate_nom, c.prenom as candidate_prenom, c.photo as candidate_photo,
                    c.telephone as candidate_telephone, c.email as candidate_email,
                    e.nom as entreprise_nom, e.secteur_activite, e.adresse as entreprise_adresse,
                    e.telephone as entreprise_telephone, e.responsable_nom
             FROM stages s
             LEFT JOIN candidates c ON s.candidate_id = c.id
             LEFT JOIN entreprises e ON s.entreprise_id = e.id
             WHERE s.id = ? AND s.deleted_at IS NULL`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Stage non trouvé' });
        }

        const stage = rows[0];

        // Parse JSON fields
        if (stage.competences_acquises && typeof stage.competences_acquises === 'string') {
            try {
                stage.competences_acquises = JSON.parse(stage.competences_acquises);
            } catch (e) {
                stage.competences_acquises = [];
            }
        }

        // Charger les évaluations
        const [evaluations] = await db.query(
            `SELECT * FROM stage_evaluations
             WHERE stage_id = ?
             ORDER BY date_evaluation ASC`,
            [stage.id]
        );
        stage.evaluations = evaluations;

        res.json(stage);
    } catch (error) {
        console.error('Error fetching stage:', error);
        res.status(500).json({ error: 'Erreur lors du chargement du stage' });
    }
};

// POST /api/stages - Créer un nouveau stage
exports.create = async (req, res) => {
    try {
        const {
            candidate_id, entreprise_id, cohorte_id, projet_id,
            date_debut, date_fin, type_stage, metier_stage,
            tuteur_nom, tuteur_fonction, tuteur_contact, tuteur_email,
            indemnite_mensuelle, frais_transport, autres_avantages,
            observations
        } = req.body;

        // Validation
        if (!candidate_id || !entreprise_id || !date_debut || !date_fin || !type_stage || !metier_stage) {
            return res.status(400).json({
                error: 'Les champs candidate_id, entreprise_id, date_debut, date_fin, type_stage et metier_stage sont requis'
            });
        }

        // Vérifier que la candidate existe
        const [candidate] = await db.query('SELECT * FROM candidates WHERE id = ?', [candidate_id]);
        if (candidate.length === 0) {
            return res.status(404).json({ error: 'Candidate non trouvée' });
        }

        // Vérifier que l'entreprise existe
        const [entreprise] = await db.query('SELECT * FROM entreprises WHERE id = ? AND deleted_at IS NULL', [entreprise_id]);
        if (entreprise.length === 0) {
            return res.status(404).json({ error: 'Entreprise non trouvée' });
        }

        // Vérifier la disponibilité de la candidate
        const [existingStages] = await db.query(
            `SELECT * FROM stages
             WHERE candidate_id = ?
             AND statut IN ('Planifié', 'En cours')
             AND deleted_at IS NULL
             AND ((date_debut BETWEEN ? AND ?) OR (date_fin BETWEEN ? AND ?))`,
            [candidate_id, date_debut, date_fin, date_debut, date_fin]
        );

        if (existingStages.length > 0) {
            return res.status(400).json({
                error: 'La candidate a déjà un stage prévu sur cette période'
            });
        }

        // Générer le code
        const code = await generateStageCode();

        const [result] = await db.query(
            `INSERT INTO stages (
                code, candidate_id, entreprise_id, cohorte_id, projet_id,
                date_debut, date_fin, type_stage, metier_stage,
                tuteur_nom, tuteur_fonction, tuteur_contact, tuteur_email,
                indemnite_mensuelle, frais_transport, autres_avantages,
                observations, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code, candidate_id, entreprise_id, cohorte_id, projet_id,
                date_debut, date_fin, type_stage, metier_stage,
                tuteur_nom, tuteur_fonction, tuteur_contact, tuteur_email,
                indemnite_mensuelle, frais_transport, autres_avantages,
                observations, req.user?.id || null
            ]
        );

        // Mettre à jour le statut de la candidate
        await db.query(
            `UPDATE candidates
             SET en_stage = TRUE,
                 nombre_stages_effectues = nombre_stages_effectues + 1,
                 dernier_stage_id = ?
             WHERE id = ?`,
            [result.insertId, candidate_id]
        );

        // Mettre à jour le compteur de l'entreprise
        await db.query(
            `UPDATE entreprises
             SET nombre_stagiaires_accueillis = nombre_stagiaires_accueillis + 1
             WHERE id = ?`,
            [entreprise_id]
        );

        const [newStage] = await db.query('SELECT * FROM stages WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Stage créé avec succès',
            stage: newStage[0]
        });
    } catch (error) {
        console.error('Error creating stage:', error);
        res.status(500).json({ error: 'Erreur lors de la création du stage' });
    }
};

// PUT /api/stages/:id - Mettre à jour un stage
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Vérifier que le stage existe
        const [existing] = await db.query(
            'SELECT * FROM stages WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Stage non trouvé' });
        }

        // Préparer competences_acquises en JSON si présent
        if (updates.competences_acquises && Array.isArray(updates.competences_acquises)) {
            updates.competences_acquises = JSON.stringify(updates.competences_acquises);
        }

        // Construire la requête dynamiquement
        const fields = Object.keys(updates).filter(key => key !== 'id');
        const values = fields.map(field => updates[field]);

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        await db.query(
            `UPDATE stages SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        const [updated] = await db.query('SELECT * FROM stages WHERE id = ?', [id]);

        res.json({
            message: 'Stage mis à jour avec succès',
            stage: updated[0]
        });
    } catch (error) {
        console.error('Error updating stage:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du stage' });
    }
};

// PUT /api/stages/:id/statut - Mettre à jour le statut d'un stage
exports.updateStatut = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, motif_abandon } = req.body;

        if (!statut) {
            return res.status(400).json({ error: 'Le statut est requis' });
        }

        const validStatuts = ['Planifié', 'En cours', 'Terminé', 'Abandonné', 'Annulé'];
        if (!validStatuts.includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }

        const [existing] = await db.query('SELECT * FROM stages WHERE id = ? AND deleted_at IS NULL', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Stage non trouvé' });
        }

        const oldStage = existing[0];

        await db.query(
            'UPDATE stages SET statut = ?, motif_abandon = ? WHERE id = ?',
            [statut, motif_abandon || null, id]
        );

        // Si le stage passe à "Terminé", mettre à jour la candidate
        if (statut === 'Terminé' && oldStage.statut !== 'Terminé') {
            await db.query(
                'UPDATE candidates SET en_stage = FALSE WHERE id = ?',
                [oldStage.candidate_id]
            );
        }

        // Si le stage passe à "En cours", mettre à jour la candidate
        if (statut === 'En cours' && oldStage.statut !== 'En cours') {
            await db.query(
                'UPDATE candidates SET en_stage = TRUE, dernier_stage_id = ? WHERE id = ?',
                [id, oldStage.candidate_id]
            );
        }

        const [updated] = await db.query('SELECT * FROM stages WHERE id = ?', [id]);

        res.json({
            message: 'Statut mis à jour avec succès',
            stage: updated[0]
        });
    } catch (error) {
        console.error('Error updating stage status:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }
};

// DELETE /api/stages/:id - Soft delete d'un stage
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query(
            'SELECT * FROM stages WHERE id = ? AND deleted_at IS NULL',
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Stage non trouvé' });
        }

        const stage = existing[0];

        // Empêcher la suppression des stages en cours
        if (stage.statut === 'En cours') {
            return res.status(400).json({
                error: 'Impossible de supprimer un stage en cours. Changez d\'abord le statut.'
            });
        }

        // Soft delete
        await db.query('UPDATE stages SET deleted_at = NOW() WHERE id = ?', [id]);

        // Mettre à jour la candidate si c'était son dernier stage
        await db.query(
            `UPDATE candidates
             SET en_stage = FALSE, dernier_stage_id = NULL
             WHERE id = ? AND dernier_stage_id = ?`,
            [stage.candidate_id, id]
        );

        res.json({ message: 'Stage supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting stage:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du stage' });
    }
};

// POST /api/stages/:id/evaluer - Ajouter une évaluation
exports.addEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            date_evaluation, periode, evaluateur_nom, evaluateur_type,
            note_competences_techniques, note_comportement_professionnel,
            note_assiduite, note_autonomie, note_integration, note_globale,
            points_forts, points_amelioration, commentaire_general, recommandations
        } = req.body;

        // Vérifier que le stage existe
        const [stage] = await db.query('SELECT * FROM stages WHERE id = ? AND deleted_at IS NULL', [id]);
        if (stage.length === 0) {
            return res.status(404).json({ error: 'Stage non trouvé' });
        }

        if (!evaluateur_type || !date_evaluation) {
            return res.status(400).json({ error: 'evaluateur_type et date_evaluation sont requis' });
        }

        const [result] = await db.query(
            `INSERT INTO stage_evaluations (
                stage_id, date_evaluation, periode, evaluateur_nom, evaluateur_type,
                note_competences_techniques, note_comportement_professionnel,
                note_assiduite, note_autonomie, note_integration, note_globale,
                points_forts, points_amelioration, commentaire_general, recommandations,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, date_evaluation, periode, evaluateur_nom, evaluateur_type,
                note_competences_techniques, note_comportement_professionnel,
                note_assiduite, note_autonomie, note_integration, note_globale,
                points_forts, points_amelioration, commentaire_general, recommandations,
                req.user?.id || null
            ]
        );

        const [newEvaluation] = await db.query('SELECT * FROM stage_evaluations WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Évaluation ajoutée avec succès',
            evaluation: newEvaluation[0]
        });
    } catch (error) {
        console.error('Error adding evaluation:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'évaluation' });
    }
};

// GET /api/stages/:id/evaluations - Évaluations d'un stage
exports.getEvaluations = async (req, res) => {
    try {
        const [evaluations] = await db.query(
            'SELECT * FROM stage_evaluations WHERE stage_id = ? ORDER BY date_evaluation ASC',
            [req.params.id]
        );

        res.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des évaluations' });
    }
};

// GET /api/stages/candidate/:candidateId - Stages d'une candidate
exports.getByCandidateId = async (req, res) => {
    try {
        const [stages] = await db.query(
            `SELECT s.*, e.nom as entreprise_nom, e.secteur_activite
             FROM stages s
             LEFT JOIN entreprises e ON s.entreprise_id = e.id
             WHERE s.candidate_id = ? AND s.deleted_at IS NULL
             ORDER BY s.date_debut DESC`,
            [req.params.candidateId]
        );

        res.json(stages);
    } catch (error) {
        console.error('Error fetching candidate stages:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des stages' });
    }
};

// GET /api/stages/entreprise/:entrepriseId - Stages d'une entreprise
exports.getByEntrepriseId = async (req, res) => {
    try {
        const [stages] = await db.query(
            `SELECT s.*, c.nom as candidate_nom, c.prenom as candidate_prenom, c.photo as candidate_photo
             FROM stages s
             LEFT JOIN candidates c ON s.candidate_id = c.id
             WHERE s.entreprise_id = ? AND s.deleted_at IS NULL
             ORDER BY s.date_debut DESC`,
            [req.params.entrepriseId]
        );

        res.json(stages);
    } catch (error) {
        console.error('Error fetching entreprise stages:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des stages' });
    }
};
