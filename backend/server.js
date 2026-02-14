require('dotenv').config();
const { validateEnv } = require('./config/env');

// Valider environnement AVANT tout le reste
validateEnv();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { initBackupScheduler } = require('./services/backupService');

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit - keep server running
});

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize backup scheduler
initBackupScheduler();

// Security middleware - CORS MUST BE FIRST
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Autoriser requêtes sans origin (Postman, mobile apps)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️  Origine bloquée par CORS: ${origin}`);
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configure Helmet to allow serving static files
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

app.use(compression()); // Compress all responses for scalability

// Rate limiting - Configuration améliorée
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requêtes par 15min
    message: 'Trop de requêtes, veuillez réessayer dans 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 tentatives de login par 15 minutes
    skipSuccessfulRequests: true,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', generalLimiter);

// Middleware (CORS moved to top)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques (photos)
app.use('/uploads', express.static('uploads'));

// Routes
const candidatesRoutes = require('./routes/candidates');
const statsRoutes = require('./routes/stats');
const exportRoutes = require('./routes/export');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const locationsRoutes = require('./routes/locations');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/centres', require('./routes/centres'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/cohortes', require('./routes/cohortes')); // New Module
app.use('/api/visites-medicales', require('./routes/visites-medicales')); // Visites Médicales Module
app.use('/api/entreprises', require('./routes/entreprises')); // Entreprises Module
app.use('/api/stages', require('./routes/stages')); // Stages Module
app.use('/api/formations', require('./routes/formations')); // Formations Module
app.use('/api/stats', statsRoutes);
app.use('/api/export', exportRoutes);

app.get('/migrate-cohortes', async (req, res) => {
    try {
        const db = require('./config/db');
        console.log('🏗️ Migrating Cohortes table via endpoint...');

        // 1. Add code_sequence
        try {
            await db.query(`ALTER TABLE cohortes ADD COLUMN code_sequence INT DEFAULT 0 AFTER code`);
            console.log('✅ Added code_sequence column');
        } catch (e) { console.log('ℹ️ code_sequence exists/error:', e.message); }

        // 2. Add location_scope
        try {
            await db.query(`ALTER TABLE cohortes ADD COLUMN location_scope ENUM('GLOBAL', 'SPECIFIC') DEFAULT 'GLOBAL' AFTER localite`);
            console.log('✅ Added location_scope column');
        } catch (e) { console.log('ℹ️ location_scope exists/error:', e.message); }

        // 3. Create pivot table
        await db.query(`
            CREATE TABLE IF NOT EXISTS cohorte_centres (
                cohorte_id INT,
                centre_id INT,
                PRIMARY KEY (cohorte_id, centre_id),
                FOREIGN KEY (cohorte_id) REFERENCES cohortes(id) ON DELETE CASCADE,
                FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created cohorte_centres table');

        // 4. Migrate data
        const [existing] = await db.query('SELECT id, centre_id FROM cohortes WHERE centre_id IS NOT NULL');
        for (const row of existing) {
            await db.query('INSERT IGNORE INTO cohorte_centres (cohorte_id, centre_id) VALUES (?, ?)', [row.id, row.centre_id]);
        }
        res.send(`Migration OK: Moved ${existing.length} records.`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Migration failed: ' + err.message);
    }
});

// Route de test
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Girl Power API is running',
        version: '2.0.0',
        authentication: 'enabled'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Une erreur est survenue sur le serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// AUTO-MIGRATION on Startup (Temporary)
const runMigration = async () => {
    try {
        const db = require('./config/db');
        console.log('🏗️ Running Auto-Migration for Cohortes...');

        // 1. Add code_sequence
        try {
            await db.query(`ALTER TABLE cohortes ADD COLUMN code_sequence INT DEFAULT 0 AFTER code`);
            console.log('✅ Added code_sequence column');
        } catch (e) { console.log('ℹ️ code_sequence check:', e.message); }

        // 2. Add location_scope
        try {
            await db.query(`ALTER TABLE cohortes ADD COLUMN location_scope ENUM('GLOBAL', 'SPECIFIC') DEFAULT 'GLOBAL' AFTER localite`);
            console.log('✅ Added location_scope column');
        } catch (e) { console.log('ℹ️ location_scope check:', e.message); }

        // 3. Create pivot table
        await db.query(`
            CREATE TABLE IF NOT EXISTS cohorte_centres (
                cohorte_id INT,
                centre_id INT,
                PRIMARY KEY (cohorte_id, centre_id),
                FOREIGN KEY (cohorte_id) REFERENCES cohortes(id) ON DELETE CASCADE,
                FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created cohorte_centres table');

        // 4. Migrate data
        const [existing] = await db.query('SELECT id, centre_id FROM cohortes WHERE centre_id IS NOT NULL');
        for (const row of existing) {
            await db.query('INSERT IGNORE INTO cohorte_centres (cohorte_id, centre_id) VALUES (?, ?)', [row.id, row.centre_id]);
        }
        console.log(`✅ Data Migration Complete: ${existing.length} records moved.`);

        // 5. Create formations table
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS formations (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    candidate_id INT NOT NULL,
                    cohorte_id INT,
                    centre_id INT,
                    projet_id INT,
                    date_debut DATE NOT NULL,
                    date_fin_prevue DATE,
                    date_fin_effective DATE,
                    statut ENUM('En formation', 'Abandonné', 'Terminé') DEFAULT 'En formation',
                    date_abandon DATE,
                    motif_abandon VARCHAR(255),
                    details_abandon TEXT,
                    circonstances_abandon TEXT,
                    signale_par VARCHAR(255),
                    observations TEXT,
                    created_by INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP NULL,
                    INDEX idx_formations_candidate (candidate_id),
                    INDEX idx_formations_statut (statut),
                    INDEX idx_formations_cohorte (cohorte_id),
                    INDEX idx_formations_projet (projet_id)
                )
            `);
            console.log('✅ Formations table ready');
        } catch (e) { console.log('ℹ️ Formations table check:', e.message); }
    } catch (err) {
        console.error('❌ Migration Failed:', err);
    }
};

// Error Handlers - DOIVENT ÊTRE APRÈS TOUTES LES ROUTES
const { errorHandler, notFound } = require('./middleware/errorHandler');

app.use(notFound);      // Gère les 404
app.use(errorHandler);  // Gère toutes les erreurs

app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    await runMigration(); // Run migration immediately
    console.log(`🔐 Authentication enabled`);
    console.log(`📧 Admin: admin@girlpower.org`);
});
