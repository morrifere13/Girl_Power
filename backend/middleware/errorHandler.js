/**
 * Middleware de gestion centralisée des erreurs
 * Capture toutes les erreurs et renvoie des réponses cohérentes
 */

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Middleware de gestion des erreurs
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log pour debugging
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method
        });
    }

    // Erreur de validation Joi
    if (err.name === 'ValidationError') {
        const message = Object.values(err.details || {})
            .map(detail => detail.message)
            .join(', ');
        error = new AppError(message, 400);
    }

    // Erreur MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Cette ressource existe déjà';
        error = new AppError(message, 409);
    }

    // Erreur MySQL foreign key constraint
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        const message = 'Impossible de supprimer: ressource référencée ailleurs';
        error = new AppError(message, 409);
    }

    // Erreur JWT invalide
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token invalide';
        error = new AppError(message, 401);
    }

    // Erreur JWT expiré
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expiré, veuillez vous reconnecter';
        error = new AppError(message, 401);
    }

    // Erreur de cast (MongoDB-like)
    if (err.name === 'CastError') {
        const message = 'Ressource non trouvée';
        error = new AppError(message, 404);
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erreur serveur';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    });
};

/**
 * Middleware pour routes non trouvées
 */
const notFound = (req, res, next) => {
    const error = new AppError(`Route non trouvée: ${req.originalUrl}`, 404);
    next(error);
};

/**
 * Wrapper pour fonctions async (évite try/catch répétitifs)
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    errorHandler,
    notFound,
    asyncHandler
};
