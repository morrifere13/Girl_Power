const db = require('../config/db');

/**
 * Log an audit entry
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
 * @param {string} entityType - Type of entity (candidate, user)
 * @param {number} entityId - ID of the entity
 * @param {object} changes - Changes made (before/after for UPDATE, data for CREATE/DELETE)
 * @param {object} req - Express request object (for IP and user-agent)
 */
const logAudit = async (userId, action, entityType, entityId, changes, req) => {
    try {
        const userEmail = req.user?.email || 'system';
        const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';

        await db.query(
            `INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, changes, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, userEmail, action, entityType, entityId, JSON.stringify(changes), ipAddress, userAgent]
        );

        console.log(`📝 Audit logged: ${action} ${entityType} #${entityId} by user #${userId}`);
    } catch (error) {
        // Don't throw error to avoid blocking the main request
        console.error('❌ Audit logging failed:', error);
    }
};

/**
 * Middleware to automatically log actions
 * Usage: router.post('/', auditLog('CREATE', 'candidate'), async (req, res) => {...})
 */
const auditLog = (action, entityType) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send to capture response
        res.send = function (data) {
            // Only log on success (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user?.id;
                const entityId = req.params.id || (typeof data === 'object' && data.id) || null;

                // For UPDATE, capture before/after
                let changes = {};
                if (action === 'UPDATE' && req.body) {
                    changes = {
                        before: req.originalData || {},
                        after: req.body
                    };
                } else if (action === 'CREATE') {
                    changes = { data: req.body };
                } else if (action === 'DELETE') {
                    changes = { deleted: req.originalData || {} };
                }

                // Log asynchronously (don't wait)
                logAudit(userId, action, entityType, entityId, changes, req).catch(err => {
                    console.error('Audit log error:', err);
                });
            }

            // Call original send
            return originalSend.call(this, data);
        };

        next();
    };
};

module.exports = {
    logAudit,
    auditLog
};
