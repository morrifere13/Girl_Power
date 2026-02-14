const db = require('./config/db');

async function alterCentresTable() {
    const columnsToAdd = [
        "ADD COLUMN creche BOOLEAN DEFAULT FALSE",
        "ADD COLUMN responsable_prenom VARCHAR(150)",
        "ADD COLUMN responsable_email_pro VARCHAR(255)",
        "ADD COLUMN responsable_email_perso VARCHAR(255)",
        "ADD COLUMN responsable_contact2 VARCHAR(20)",
        "ADD COLUMN responsable_fonction VARCHAR(100)",
        "ADD COLUMN telephone_2 VARCHAR(20)",
        "MODIFY COLUMN type_centre VARCHAR(50)"
    ];

    console.log('🏗 Altering table: centres...');

    for (const col of columnsToAdd) {
        try {
            await db.query(`ALTER TABLE centres ${col}`);
            console.log(`✅ Executed: ALTER TABLE centres ${col}`);
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log(`ℹ️ Column already exists: ${col}`);
            } else {
                console.error(`❌ Error executing ${col}:`, error.message);
                // Don't exit, try others
            }
        }
    }

    console.log('✅ Centres table update process finished.');
    process.exit(0);
}

alterCentresTable();
