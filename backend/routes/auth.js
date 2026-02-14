const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, verifyToken } = require('../middleware/authMiddleware');
const { validate, authSchemas } = require('../middleware/validationMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

// POST /api/auth/login - Authenticate user
router.post('/login', validate(authSchemas.login), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: 'Email ou mot de passe incorrect'
            });
        }

        const user = users[0];

        // Check if user is active
        if (user.statut !== 'actif') {
            return res.status(403).json({
                error: 'Compte inactif ou suspendu'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Email ou mot de passe incorrect'
            });
        }

        // Update last login
        await db.query(
            'UPDATE users SET derniere_connexion = NOW() WHERE id = ?',
            [user.id]
        );

        // Generate JWT token
        const token = generateToken(user);

        // Return user info (without password) and token
        const { password: _, ...userWithoutPassword } = user;

        // Log audit
        await logAudit(user.id, 'LOGIN', 'user', user.id, {}, req);

        res.json({
            message: 'Connexion réussie',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', require('../middleware/authMiddleware').verifyToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, nom, prenom, role, statut, derniere_connexion, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des informations' });
    }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', verifyToken, async (req, res) => {
    // Log audit
    if (req.user) {
        await logAudit(req.user.id, 'LOGOUT', 'user', req.user.id, {}, req);
    }

    // With JWT, logout is handled client-side by removing the token
    // This endpoint is mainly for logging purposes
    res.json({ message: 'Déconnexion réussie' });
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', require('../middleware/authMiddleware').verifyToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT * FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0 || users[0].statut !== 'actif') {
            return res.status(401).json({ error: 'Session invalide' });
        }

        const newToken = generateToken(users[0]);
        res.json({ token: newToken });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Erreur lors du rafraîchissement du token' });
    }
});

module.exports = router;
