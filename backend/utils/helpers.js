/**
 * Fonctions utilitaires partagées - Backend
 * Centralise toutes les fonctions dupliquées dans les routes
 */

/**
 * Calcule la durée entre deux dates
 * @param {string|Date} startDate - Date de début
 * @param {string|Date} endDate - Date de fin
 * @returns {Object} { jours, mois, annees, total_jours }
 */
function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;

    return {
        jours: days,
        mois: months,
        annees: years,
        total_jours: diffDays
    };
}

/**
 * Parse JSON de manière sécurisée
 * @param {string|Object} value - Valeur à parser
 * @param {*} fallback - Valeur par défaut si parsing échoue
 * @returns {*} Objet parsé ou fallback
 */
function safeJsonParse(value, fallback = null) {
    if (typeof value === 'object') return value;
    if (!value || value === '') return fallback;

    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn('❌ JSON parse error:', error.message);
        return fallback;
    }
}

/**
 * Récupère les colonnes d'une table avec cache
 * @param {Object} db - Connexion DB
 * @param {string} tableName - Nom de la table
 * @returns {Promise<Array>} Liste des colonnes
 */
const tableColumnsCache = new Map();

async function getTableColumns(db, tableName) {
    if (tableColumnsCache.has(tableName)) {
        return tableColumnsCache.get(tableName);
    }

    const [columns] = await db.query('SHOW COLUMNS FROM ??', [tableName]);
    const columnNames = columns.map(col => col.Field);
    tableColumnsCache.set(tableName, columnNames);

    return columnNames;
}

/**
 * Nettoie les filtres de recherche
 * @param {Object} filters - Filtres bruts
 * @returns {Object} Filtres nettoyés
 */
function sanitizeFilters(filters) {
    const clean = {};

    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
            clean[key] = value;
        }
    }

    return clean;
}

/**
 * Construit WHERE clause dynamique pour recherches
 * @param {Array} searchColumns - Colonnes à rechercher
 * @param {string} searchTerm - Terme de recherche
 * @returns {Object} { clause, params }
 */
function buildSearchClause(searchColumns, searchTerm) {
    if (!searchTerm || searchColumns.length === 0) {
        return { clause: '', params: [] };
    }

    const conditions = searchColumns.map(col => `${col} LIKE ?`).join(' OR ');
    const params = searchColumns.map(() => `%${searchTerm}%`);

    return {
        clause: `(${conditions})`,
        params
    };
}

/**
 * Pagination helper
 * @param {number} page - Numéro de page (commence à 1)
 * @param {number} limit - Nombre d'items par page
 * @returns {Object} { offset, limit }
 */
function getPaginationParams(page = 1, limit = 10) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    return {
        offset: (pageNum - 1) * limitNum,
        limit: limitNum,
        page: pageNum
    };
}

/**
 * Calcule l'âge à partir de la date de naissance
 * @param {string|Date} birthDate - Date de naissance
 * @returns {number} Âge en années
 */
function calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Formate un numéro de téléphone
 * @param {string} phone - Numéro brut
 * @returns {string} Numéro formaté
 */
function formatPhone(phone) {
    if (!phone) return '';

    // Enlève tous les caractères non numériques sauf le +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Format: +221 77 123 45 67
    if (cleaned.startsWith('+221')) {
        const number = cleaned.slice(4);
        return `+221 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 7)} ${number.slice(7)}`;
    }

    return cleaned;
}

/**
 * Valide un email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Génère un ID unique
 * @param {string} prefix - Préfixe optionnel
 * @returns {string}
 */
function generateUniqueId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}${timestamp}-${random}`;
}

module.exports = {
    calculateDuration,
    safeJsonParse,
    getTableColumns,
    sanitizeFilters,
    buildSearchClause,
    getPaginationParams,
    calculateAge,
    formatPhone,
    isValidEmail,
    generateUniqueId
};
