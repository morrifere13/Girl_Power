const db = require('./config/db');

async function addZonesToCohortes() {
    try {
        console.log('🏗️ Adding zones_intervention to cohortes table...');

        const [columns] = await db.query('SHOW COLUMNS FROM cohortes LIKE "zones_intervention"');
        
        if (columns.length === 0) {
            await db.query(`
                ALTER TABLE cohortes 
                ADD COLUMN zones_intervention JSON AFTER localite
            `);
            console.log('✅ Column zones_intervention added successfully!');
        } else {
            console.log('ℹ️ Column zones_intervention already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addZonesToCohortes();
