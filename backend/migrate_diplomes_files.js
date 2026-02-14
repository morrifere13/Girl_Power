const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Starting migration for diplomes and files tables...');

        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'migrations', '002_add_diplomes_and_files.sql'),
            'utf8'
        );

        // Split by semicolon and execute each statement
        const statements = migrationSQL.split(';').filter(stmt => stmt.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await db.query(statement);
                console.log('✓ Executed statement');
            }
        }

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
