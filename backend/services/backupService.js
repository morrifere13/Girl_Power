const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config();

// Répertoire des backups
const backupDir = path.join(__dirname, '../../backups');

// Assurer que le dossier existe
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Effectue un backup de la base de données
 */
const performBackup = async () => {
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${process.env.DB_NAME}-${date}.sql`;
    const filepath = path.join(backupDir, filename);

    // Utiliser le chemin configuré ou mysqldump par défaut
    const mysqldumpPath = process.env.MYSQLDUMP_PATH || 'mysqldump';
    const command = `"${mysqldumpPath}" -h ${process.env.DB_HOST} -u ${process.env.DB_USER} --password=${process.env.DB_PASSWORD} ${process.env.DB_NAME} > "${filepath}"`;

    console.log('📦 Starting database backup...');

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Backup failed: ${error.message}`);
            return;
        }
        if (stderr) {
            // Mysqldump writes to stderr sometimes even on success, check specific errors if needed
            // console.log(`Stderr: ${stderr}`);
        }
        console.log(`✅ Backup successful: ${filename}`);

        // Nettoyage des vieux backups (garder 7 jours)
        cleanOldBackups();
    });
};

/**
 * Supprime les backups vieux de plus de 7 jours
 */
const cleanOldBackups = () => {
    fs.readdir(backupDir, (err, files) => {
        if (err) return;

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        files.forEach(file => {
            const filepath = path.join(backupDir, file);
            fs.stat(filepath, (err, stats) => {
                if (err) return;
                if (stats.mtimeMs < sevenDaysAgo) {
                    fs.unlink(filepath, () => console.log(`Deleted old backup: ${file}`));
                }
            });
        });
    });
};

/**
 * Initialise le scheduler
 */
const initBackupScheduler = () => {
    // Exécuter tous les jours à minuit (0 0 * * *)
    cron.schedule('0 0 * * *', () => {
        performBackup();
    });
    console.log('⏰ Backup scheduler initialized (Daily at 00:00)');
};

module.exports = {
    performBackup,
    initBackupScheduler
};
