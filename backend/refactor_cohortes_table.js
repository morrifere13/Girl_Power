const mysql = require('mysql2');
require('dotenv').config();

// Manual pool to force 127.0.0.1
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const db = pool.promise();

async function refactorCohortesTable() {
    try {
        console.log('DEBUG: DB Config:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME
        });
        console.log('🏗️ Refactoring Cohortes table...');

        // 1. Add new columns to cohortes
        try {
            await db.query(`ALTER TABLE cohortes ADD COLUMN code_sequence INT DEFAULT 0 AFTER code`);
            console.log('✅ Added code_sequence column');
        } catch (e) { console.log('ℹ️ code_sequence already exists or error:', e.message); }

        try {
            await db.query(`ALTER TABLE cohortes ADD COLUMN location_scope ENUM('GLOBAL', 'SPECIFIC') DEFAULT 'GLOBAL' AFTER localite`);
            console.log('✅ Added location_scope column');
        } catch (e) { console.log('ℹ️ location_scope already exists or error:', e.message); }

        // 2. Create pivot table cohorte_centres
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

        // 3. Migrate existing data: Move centre_id to cohorte_centres
        const [existing] = await db.query('SELECT id, centre_id FROM cohortes WHERE centre_id IS NOT NULL');
        for (const row of existing) {
            await db.query('INSERT IGNORE INTO cohorte_centres (cohorte_id, centre_id) VALUES (?, ?)', [row.id, row.centre_id]);
        }
        console.log(`✅ Migrated ${existing.length} existing centre relations`);

        // 4. Drop old column (Optional: keep for backup or drop now)
        // await db.query('ALTER TABLE cohortes DROP FOREIGN KEY cohortes_ibfk_2'); // Adjust FK name
        // await db.query('ALTER TABLE cohortes DROP COLUMN centre_id');
        // console.log('✅ Dropped centre_id column'); 
        // Keeping it for safety for now, just ignoring it in new code.

        console.log('🎉 Refactoring Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error refactoring:', error);
        process.exit(1);
    }
}

refactorCohortesTable();
