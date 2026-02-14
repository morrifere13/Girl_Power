const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

router.use(verifyToken);

// GET /api/centres - List all centers with filters
router.get('/', async (req, res) => {
    try {
        const { search, region, type_centre } = req.query;
        let query = 'SELECT * FROM centres WHERE deleted_at IS NULL';
        const params = [];

        if (search) {
            query += ' AND (nom LIKE ? OR code LIKE ? OR ville LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (region) {
            query += ' AND region = ?';
            params.push(region);
        }
        if (type_centre) {
            query += ' AND type_centre = ?';
            params.push(type_centre);
        }

        query += ' ORDER BY created_at DESC';

        const [centres] = await db.query(query, params);

        for (const centre of centres) {
            const [rows] = await db.query('SELECT COUNT(*) as count FROM centre_metiers WHERE centre_id = ?', [centre.id]);
            centre.nb_metiers = rows[0].count;
        }

        res.json(centres);
    } catch (error) {
        console.error('Error fetching centres:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des centres' });
    }
});

// GET /api/centres/:id - Get one center details
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM centres WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Centre non trouvé' });

        const centre = rows[0];

        let metiers = [];
        try {
            const [mRows] = await db.query('SELECT * FROM centre_metiers WHERE centre_id = ?', [centre.id]);
            metiers = mRows;
        } catch (mErr) {
            console.warn('Could not fetch metiers:', mErr.message);
        }
        centre.metiers = metiers.map(m => {
            // Backend-side sanitization for double-encoded strings
            let cleanName = m.metier_choisi;
            if (cleanName && typeof cleanName === 'string' && cleanName.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(cleanName);
                    // If it parses to array, take first or join? 
                    // Usually it's single selection per row, so if array, flatten it?
                    // But DB structure is 1 row per metier. 
                    // If we have '["A","B"]', we should probably return multiple objects?
                    // But here we can only return one object. 
                    // We'll just return the parsed value if it's a string, or join it if array.
                    if (Array.isArray(parsed)) cleanName = parsed.join(', ');
                    else cleanName = parsed;
                } catch (e) { /* ignore */ }
            }
            return { ...m, metier_choisi: cleanName };
        });

        // Load linked projects
        try {
            console.log(`🔍 Fetching projects for centre ${centre.id}`);
            const [projects] = await db.query(`
                SELECT p.id, p.nom, p.code, p.statut, p.date_debut, p.date_fin, p.cible_quantitative
                FROM projects p
                JOIN project_centres pc ON p.id = pc.project_id
                WHERE pc.centre_id = ? AND p.deleted_at IS NULL
                ORDER BY p.created_at DESC
            `, [centre.id]);
            console.log(`✅ Found ${projects.length} projects for centre ${centre.id}`);
            centre.projects = projects;
        } catch (pErr) {
            console.warn('Could not fetch linked projects:', pErr.message);
            centre.projects = [];
        }

        res.json(centre);
    } catch (error) {
        console.error('Error fetching centre details:', error);
        res.status(500).json({ error: 'Erreur serveur lors du chargement du centre' });
    }
});

// Helper to insert metiers (avec protection contre les doublons)
async function insertMetiers(connection, centreId, metiersData) {
    if (!metiersData) return;

    let parsedMetiers = [];
    try {
        parsedMetiers = typeof metiersData === 'string' ? JSON.parse(metiersData) : metiersData;
    } catch (e) {
        console.warn('Invalid metiers JSON:', metiersData);
        return;
    }

    if (Array.isArray(parsedMetiers) && parsedMetiers.length > 0) {
        // Utiliser un Set pour éviter les doublons dans les données d'entrée
        const uniqueMetiers = new Set();

        for (const m of parsedMetiers) {
            // Handle both {metier_choisi: 'Name'} object and simple 'Name' string
            const metierName = (typeof m === 'object' && m !== null) ? m.metier_choisi : m;

            if (metierName && typeof metierName === 'string' && !uniqueMetiers.has(metierName.trim())) {
                uniqueMetiers.add(metierName.trim());

                // Vérifier si le métier existe déjà pour ce centre
                const [existing] = await connection.query(
                    'SELECT id FROM centre_metiers WHERE centre_id = ? AND metier_choisi = ?',
                    [centreId, metierName.trim()]
                );

                if (existing.length === 0) {
                    await connection.query(
                        'INSERT INTO centre_metiers (centre_id, metier_choisi, capacite_max) VALUES (?, ?, ?)',
                        [centreId, metierName.trim(), 0]
                    );
                }
            }
        }
    }
}

// POST /api/centres - Create new center
router.post('/', requireRole(['admin', 'gestionnaire']), upload.single('photo'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            code, nom, type_centre, region, ville, adresse,
            latitude, longitude, telephone, telephone_2, email,
            responsable_nom, responsable_prenom, responsable_contact, responsable_contact2,
            responsable_email_pro, responsable_email_perso, responsable_fonction,
            capacite_accueil, description, creche,
            metiers
        } = req.body;

        const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
        const isCreche = creche === 'true' || creche === true || creche === 1 || creche === '1';

        const [result] = await connection.query(`
            INSERT INTO centres 
            (code, nom, type_centre, region, ville, adresse, latitude, longitude, 
            telephone, telephone_2, email, 
            responsable_nom, responsable_prenom, responsable_contact, responsable_contact2,
            responsable_email_pro, responsable_email_perso, responsable_fonction, 
            capacite_accueil, description, creche, photo_url, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            code, nom, type_centre, region, ville, adresse,
            latitude || null, longitude || null, telephone, telephone_2, email,
            responsable_nom, responsable_prenom, responsable_contact, responsable_contact2,
            responsable_email_pro, responsable_email_perso, responsable_fonction,
            capacite_accueil || 0, description, isCreche,
            photo_url, req.user.id
        ]);

        await insertMetiers(connection, result.insertId, metiers);

        await connection.commit();
        res.status(201).json({ id: result.insertId, message: 'Centre créé avec succès' });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating centre:', error);
        res.status(500).json({ error: 'Erreur lors de la création du centre', details: error.message });
    } finally {
        connection.release();
    }
});

// PUT /api/centres/:id - Update center
router.put('/:id', requireRole(['admin', 'gestionnaire']), upload.single('photo'), async (req, res) => {
    console.log('🔄 PUT /api/centres/:id triggered');
    console.log('📥 Body:', req.body);
    console.log('📥 Metiers Raw:', req.body.metiers);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            code, nom, type_centre, region, ville, adresse,
            latitude, longitude, telephone, telephone_2, email,
            responsable_nom, responsable_prenom, responsable_contact, responsable_contact2,
            responsable_email_pro, responsable_email_perso, responsable_fonction,
            capacite_accueil, description, creche,
            metiers, statut
        } = req.body;

        const isCreche = creche === 'true' || creche === true || creche === 1 || creche === '1';

        let updateQuery = `
            UPDATE centres SET 
            code=?, nom=?, type_centre=?, region=?, ville=?, adresse=?, 
            latitude=?, longitude=?, telephone=?, telephone_2=?, email=?, 
            responsable_nom=?, responsable_prenom=?, responsable_contact=?, responsable_contact2=?,
            responsable_email_pro=?, responsable_email_perso=?, responsable_fonction=?,
            capacite_accueil=?, description=?, creche=?, statut=?
        `;
        const params = [
            code, nom, type_centre, region, ville, adresse,
            latitude || null, longitude || null, telephone, telephone_2, email,
            responsable_nom, responsable_prenom, responsable_contact, responsable_contact2,
            responsable_email_pro, responsable_email_perso, responsable_fonction,
            capacite_accueil, description, isCreche, statut
        ];

        if (req.file) {
            updateQuery += ', photo_url=?';
            params.push(`/uploads/${req.file.filename}`);
        }

        updateQuery += ' WHERE id = ?';
        params.push(req.params.id);

        await connection.query(updateQuery, params);

        // Always update metiers if provided (or strictly if not undefined? User implies full replace)
        if (metiers !== undefined) {
            await connection.query('DELETE FROM centre_metiers WHERE centre_id = ?', [req.params.id]);
            await insertMetiers(connection, req.params.id, metiers);
        }

        await connection.commit();
        res.json({ message: 'Centre mis à jour avec succès' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating centre:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
    } finally {
        connection.release();
    }
});

router.delete('/:id', requireRole(['admin']), async (req, res) => {
    try {
        await db.query('UPDATE centres SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        res.json({ message: 'Centre supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting centre:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
});

module.exports = router;
