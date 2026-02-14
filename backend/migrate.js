const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runMigrations() {
    try {
        const migrationFile = path.join(__dirname, 'migrations', '001_add_new_fields.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('Running migration...');
        await db.query(sql);
        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
