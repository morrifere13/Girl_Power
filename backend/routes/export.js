const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { generateCandidatesExcel } = require('../services/excelService');

// GET /api/export/candidates - Export candidates to Excel (Admin & Gestionnaire)
router.get('/candidates', verifyToken, requireRole(['admin', 'gestionnaire']), async (req, res) => {
    try {
        // Récupérer toutes les candidates
        // Note: On pourrait réutiliser la logique de filtrage si nécessaire
        const [candidates] = await db.query('SELECT * FROM candidates ORDER BY created_at DESC');

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Aucune candidate à exporter' });
        }

        const workbook = await generateCandidatesExcel(candidates);

        // Configurer les headers pour le téléchargement
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=' + 'candidates_girl_power.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export Excel' });
    }
});

module.exports = router;
