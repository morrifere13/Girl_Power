/**
 * Validation des variables d'environnement
 * S'assure que toutes les variables critiques sont définies
 */

const requiredEnvVars = [
    'JWT_SECRET',
    'DB_HOST',
    'DB_USER',
    'DB_NAME'
];

const optionalEnvVars = {
    NODE_ENV: 'development',
    PORT: '5000',
    DB_PORT: '3306',
    JWT_EXPIRES_IN: '24h',
    FRONTEND_URL: 'http://localhost:3000',
    UPLOAD_DIR: 'uploads',
    MAX_FILE_SIZE: '20971520',
    LOG_LEVEL: 'info',
    RATE_LIMIT_WINDOW_MS: '900000',
    RATE_LIMIT_MAX_REQUESTS: '100',
    RATE_LIMIT_AUTH_MAX: '5'
};

function validateEnv() {
    const missing = [];
    const warnings = [];

    // Vérifier variables requises
    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        console.error('\n❌ ERREUR: Variables d\'environnement manquantes:\n');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\n📋 Copiez .env.example vers .env et remplissez les valeurs.\n');
        process.exit(1);
    }

    // Définir valeurs par défaut pour variables optionnelles
    for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
        if (!process.env[varName]) {
            process.env[varName] = defaultValue;
            warnings.push(`${varName} non défini, utilisation de la valeur par défaut: ${defaultValue}`);
        }
    }

    // Validations spécifiques
    validateJwtSecret();
    validateNodeEnv();
    validatePort();
    validateDatabase();

    // Afficher warnings si en mode développement
    if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('\n⚠️  Avertissements variables d\'environnement:');
        warnings.forEach(w => console.warn(`   - ${w}`));
    }

    console.log('\n✅ Variables d\'environnement validées\n');
}

function validateJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (secret.length < 32) {
        console.error('\n❌ ERREUR: JWT_SECRET doit faire minimum 32 caractères');
        console.error('   Générez-en un avec: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
        process.exit(1);
    }

    if (secret === 'CHANGE_THIS_TO_RANDOM_32_CHAR_STRING_IN_PRODUCTION') {
        if (process.env.NODE_ENV === 'production') {
            console.error('\n❌ ERREUR: JWT_SECRET par défaut détecté en PRODUCTION!');
            console.error('   Vous DEVEZ changer cette valeur pour la sécurité.\n');
            process.exit(1);
        } else {
            console.warn('\n⚠️  WARNING: JWT_SECRET utilise la valeur par défaut');
            console.warn('   Changez-le avant de passer en production!\n');
        }
    }
}

function validateNodeEnv() {
    const validEnvs = ['development', 'production', 'test'];
    const env = process.env.NODE_ENV;

    if (!validEnvs.includes(env)) {
        console.warn(`\n⚠️  WARNING: NODE_ENV="${env}" invalide. Valeurs acceptées: ${validEnvs.join(', ')}`);
        console.warn('   Utilisation de "development" par défaut\n');
        process.env.NODE_ENV = 'development';
    }
}

function validatePort() {
    const port = parseInt(process.env.PORT);

    if (isNaN(port) || port < 1 || port > 65535) {
        console.error(`\n❌ ERREUR: PORT="${process.env.PORT}" invalide`);
        console.error('   Le port doit être un nombre entre 1 et 65535\n');
        process.exit(1);
    }
}

function validateDatabase() {
    const dbPort = parseInt(process.env.DB_PORT);

    if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
        console.warn(`\n⚠️  WARNING: DB_PORT="${process.env.DB_PORT}" invalide, utilisation de 3306\n`);
        process.env.DB_PORT = '3306';
    }

    // Vérifier que DB_PASSWORD est défini en production
    if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
        console.error('\n❌ ERREUR: DB_PASSWORD est vide en PRODUCTION!');
        console.error('   Définissez un mot de passe pour votre base de données.\n');
        process.exit(1);
    }
}

function getConfig() {
    return {
        env: process.env.NODE_ENV,
        port: parseInt(process.env.PORT),
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN
        },
        db: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT)
        },
        email: {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_PASSWORD,
            from: process.env.EMAIL_FROM
        },
        upload: {
            dir: process.env.UPLOAD_DIR,
            maxSize: parseInt(process.env.MAX_FILE_SIZE)
        },
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
            authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX)
        },
        frontend: {
            url: process.env.FRONTEND_URL,
            allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || []
        }
    };
}

module.exports = {
    validateEnv,
    getConfig
};
