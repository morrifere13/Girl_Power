const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { validate, authSchemas } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(verifyToken);

// GET /api/users - List all users (admin only)
router.get('/', requireRole(['admin']), async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, nom, prenom, role, statut, derniere_connexion, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({
            data: users,
            total: users.length
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
});

// GET /api/users/:id - Get user by ID (admin only)
router.get('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, nom, prenom, role, statut, derniere_connexion, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
    }
});

// POST /api/users - Create new user (admin only)
router.post('/', requireRole(['admin']), validate(authSchemas.register), async (req, res) => {
    try {
        const { email, password, nom, prenom, role } = req.body;

        // Check if email already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await db.query(
            'INSERT INTO users (email, password, nom, prenom, role, statut) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, nom, prenom, role || 'consultant', 'actif']
        );

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
    }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const { nom, prenom, role, statut } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Prevent admin from changing their own role
        if (parseInt(userId) === req.user.id && role && role !== req.user.role) {
            return res.status(400).json({
                error: 'Vous ne pouvez pas modifier votre propre rôle'
            });
        }

        // Update user
        await db.query(
            'UPDATE users SET nom = ?, prenom = ?, role = ?, statut = ? WHERE id = ?',
            [nom, prenom, role, statut, userId]
        );

        res.json({ message: 'Utilisateur mis à jour avec succès' });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({
                error: 'Vous ne pouvez pas supprimer votre propre compte'
            });
        }

        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Delete user
        await db.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Utilisateur supprimé avec succès' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});

// PUT /api/users/:id/password - Change password
router.put('/:id/password', validate(authSchemas.changePassword), async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.params.id;

        // Users can only change their own password unless admin
        if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Vous ne pouvez modifier que votre propre mot de passe'
            });
        }

        // Get current user
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Verify current password (not required for admin changing other users' passwords)
        if (parseInt(userId) === req.user.id) {
            const isValid = await bcrypt.compare(currentPassword, users[0].password);
            if (!isValid) {
                return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Mot de passe modifié avec succès' });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    }
});

module.exports = router;
