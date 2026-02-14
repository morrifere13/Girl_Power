const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// GET /api/audit - Get all audit logs (admin only)
router.get('/', requireRole(['admin']), async (req, res) => {
    try {
        const {
            action,
            entityType,
            userId,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = req.query;

        let query = 'SELECT * FROM audit_log WHERE 1=1';
        const params = [];

        if (action) {
            query += ' AND action = ?';
            params.push(action);
        }

        if (entityType) {
            query += ' AND entity_type = ?';
            params.push(entityType);
        }

        if (userId) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        if (startDate) {
            query += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND created_at <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [logs] = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM audit_log WHERE 1=1';
        const countParams = params.slice(0, -2); // Remove limit and offset
        const [countResult] = await db.query(countQuery, countParams);

        res.json({
            data: logs,
            total: countResult[0].total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des logs' });
    }
});

// GET /api/audit/recent - Get recent audit logs (last 50)
router.get('/recent', requireRole(['admin']), async (req, res) => {
    try {
        const [logs] = await db.query(
            'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50'
        );

        res.json({ data: logs });
    } catch (error) {
        console.error('Error fetching recent logs:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des logs récents' });
    }
});

// GET /api/audit/candidate/:id - Get audit history for a specific candidate
router.get('/candidate/:id', async (req, res) => {
    try {
        const [logs] = await db.query(
            `SELECT * FROM audit_log 
             WHERE entity_type = 'candidate' AND entity_id = ? 
             ORDER BY created_at DESC`,
            [req.params.id]
        );

        res.json({ data: logs });
    } catch (error) {
        console.error('Error fetching candidate audit logs:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
    }
});

// GET /api/audit/user/:id - Get all actions by a specific user
router.get('/user/:id', requireRole(['admin']), async (req, res) => {
    try {
        const [logs] = await db.query(
            'SELECT * FROM audit_log WHERE user_id = ? ORDER BY created_at DESC',
            [req.params.id]
        );

        res.json({ data: logs });
    } catch (error) {
        console.error('Error fetching user audit logs:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des actions utilisateur' });
    }
});

// GET /api/audit/stats - Get audit statistics (admin only)
router.get('/stats', requireRole(['admin']), async (req, res) => {
    try {
        // Total logs
        const [totalLogs] = await db.query('SELECT COUNT(*) as total FROM audit_log');

        // Logs by action
        const [logsByAction] = await db.query(
            'SELECT action, COUNT(*) as count FROM audit_log GROUP BY action'
        );

        // Logs by entity type
        const [logsByEntity] = await db.query(
            'SELECT entity_type, COUNT(*) as count FROM audit_log GROUP BY entity_type'
        );

        // Most active users
        const [activeUsers] = await db.query(
            `SELECT user_email, COUNT(*) as actions 
             FROM audit_log 
             GROUP BY user_email 
             ORDER BY actions DESC 
             LIMIT 10`
        );

        // Recent activity (last 7 days)
        const [recentActivity] = await db.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count 
             FROM audit_log 
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );

        res.json({
            total: totalLogs[0].total,
            byAction: logsByAction,
            byEntity: logsByEntity,
            activeUsers,
            recentActivity
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
});

module.exports = router;
