const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Use shared pool
const pool = db;

// GET /api/locations/regions
router.get('/regions', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT DISTINCT region FROM locations ORDER BY region');
        const regions = rows.map(r => r.region).filter(r => r);
        res.json(regions);
    } catch (error) {
        console.error('Error fetching regions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/locations/villes/:region
// Returns Sous-Prefectures for a given region (Legacy support, rename implied but kept for compat)
router.get('/villes/:region', async (req, res) => {
    try {
        const { region } = req.params;
        const [rows] = await pool.query(
            'SELECT DISTINCT sous_prefecture FROM locations WHERE region = ? ORDER BY sous_prefecture',
            [region]
        );
        const villes = rows.map(r => r.sous_prefecture).filter(v => v);
        res.json(villes);
    } catch (error) {
        console.error('Error fetching villes:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/locations/departements/:region
router.get('/departements/:region', async (req, res) => {
    try {
        const { region } = req.params;
        const [rows] = await pool.query(
            'SELECT DISTINCT departement FROM locations WHERE region = ? ORDER BY departement',
            [region]
        );
        const results = rows.map(r => r.departement).filter(r => r);
        res.json(results);
    } catch (error) {
        console.error('Error fetching departements:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/locations/sous-prefectures/:departement
router.get('/sous-prefectures/:departement', async (req, res) => {
    try {
        const { departement } = req.params;
        const [rows] = await pool.query(
            'SELECT DISTINCT sous_prefecture FROM locations WHERE departement = ? ORDER BY sous_prefecture',
            [departement]
        );
        const results = rows.map(r => r.sous_prefecture).filter(r => r);
        res.json(results);
    } catch (error) {
        console.error('Error fetching sous-prefectures:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/locations/localites/:sous_prefecture
router.get('/localites/:sous_prefecture', async (req, res) => {
    try {
        const { sous_prefecture } = req.params;
        const [rows] = await pool.query(
            'SELECT DISTINCT localite FROM locations WHERE sous_prefecture = ? ORDER BY localite',
            [sous_prefecture]
        );
        const results = rows.map(r => r.localite).filter(r => r);
        res.json(results);
    } catch (error) {
        console.error('Error fetching localites:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/locations/search?q=...
// Autocomplete for Localite (Lieu de naissance)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json([]);

        const [rows] = await pool.query(
            'SELECT DISTINCT localite FROM locations WHERE localite LIKE ? LIMIT 20',
            [`%${q}%`]
        );
        const results = rows.map(r => r.localite);
        res.json(results);
    } catch (error) {
        console.error('Error searching locations:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/locations/search-ville?q=...&region=...
// Autocomplete for Ville/Village (returns ville with region and chef-lieu)
// Filters by region if provided
router.get('/search-ville', async (req, res) => {
    try {
        const { q, region } = req.query;
        // User confirmed input always starts with Uppercase, but we'll use broad matching for robustness
        if (!q || q.length < 2) return res.json([]);

        // REQUÊTE AMÉLIORÉE:
        // 1. Filtrer STRICTEMENT par la région sélectionnée (si fournie)
        // 2. Chercher "q" dans localite OU sous_prefecture OU departement
        // 3. Retourner la localite (ville/village) finale

        let query = `SELECT DISTINCT localite as ville, region, chef_lieu_region
                     FROM locations
                     WHERE (
                        localite LIKE ? 
                        OR sous_prefecture LIKE ? 
                        OR departement LIKE ?
                     )`;

        const searchTerm = `%${q}%`;
        const params = [searchTerm, searchTerm, searchTerm];

        // Filter by region if provided (Crucial as per user request)
        // The user wants "ses localite de la region selectionnee"
        if (region) {
            query += ` AND region = ?`;
            params.push(region);
        }

        // IMPROVED SORTING:
        // 1. Matches starting with Query in Localite (Highest priority)
        // 2. Matches where Query is found in Localite
        // 3. Matches in Sous-Prefecture or Departement
        query += ` ORDER BY 
                   CASE 
                     WHEN localite LIKE '${searchTerm.replace(/%/g, '')}%' THEN 1 
                     WHEN localite LIKE ? THEN 2
                     WHEN sous_prefecture LIKE ? OR departement LIKE ? THEN 3
                     ELSE 4
                   END,
                   localite ASC 
                   LIMIT 50`;

        // We need 3 params for the CASE statement placeholders + the existing ones
        // Existing params: [searchTerm, searchTerm, searchTerm, (optional region)]
        // CASE params: [searchTerm, searchTerm, searchTerm]
        // This is tricky with ? placeholder order.
        // Let's rewrite cleaner:

        let sql = `SELECT DISTINCT localite as ville, region, chef_lieu_region, sous_prefecture, departement
                     FROM locations
                     WHERE (
                        localite LIKE ? 
                        OR sous_prefecture LIKE ? 
                        OR departement LIKE ?
                     )`;

        const sqlParams = [searchTerm, searchTerm, searchTerm];

        if (region) {
            sql += ` AND region = ?`;
            sqlParams.push(region);
        }

        // Add sorting logic
        sql += ` ORDER BY 
                   CASE 
                     WHEN localite LIKE ? THEN 1 
                     ELSE 2
                   END,
                   localite ASC 
                   LIMIT 100`;

        // Re-use logic: simplify sorting to just put exact-ish localite matches first
        // If user typed 'Tabou', localites starting with 'Tabou' come first.
        // Villages in Dept 'Tabou' come after.
        sqlParams.push(`${q}%`); // For the CASE WHEN localite LIKE 'Tabou%'

        const [rows] = await pool.query(sql, sqlParams);
        res.json(rows);
    } catch (error) {
        console.error('Error searching ville:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/locations/chef-lieu/:region
// Get chef-lieu for a given region
router.get('/chef-lieu/:region', async (req, res) => {
    try {
        const { region } = req.params;
        const [rows] = await pool.query(
            'SELECT DISTINCT chef_lieu_region FROM locations WHERE region = ? LIMIT 1',
            [region]
        );
        if (rows.length > 0) {
            res.json({ chef_lieu: rows[0].chef_lieu_region });
        } else {
            res.json({ chef_lieu: null });
        }
    } catch (error) {
        console.error('Error fetching chef-lieu:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
