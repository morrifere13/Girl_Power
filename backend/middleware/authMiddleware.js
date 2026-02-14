const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'girl-power-secret-key-2026-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;

        // Check Authorization header first
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        }
        // Fallback to query parameter (for file downloads/exports)
        else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                error: 'Accès refusé. Token manquant.'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expiré. Veuillez vous reconnecter.'
            });
        }
        return res.status(401).json({
            error: 'Token invalide.'
        });
    }
};

// Middleware to check user role
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentification requise.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Permissions insuffisantes.'
            });
        }

        next();
    };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
    } catch (error) {
        // Silently fail, user remains unauthenticated
    }
    next();
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            nom: user.nom,
            prenom: user.prenom
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

module.exports = {
    verifyToken,
    requireRole,
    optionalAuth,
    generateToken,
    JWT_SECRET
};
