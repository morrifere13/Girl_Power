const db = require('./config/db');

async function cleanData() {
    try {
        console.log('🧹 Cleaning up corrupted data in centre_metiers...');

        // Delete rows where metier_choisi contains "[object Object]" or is suspiciously long/json-like
        const [result] = await db.query(`
            DELETE FROM centre_metiers 
            WHERE metier_choisi LIKE '%[object Object]%' 
            OR metier_choisi LIKE '%{%' 
            OR metier_choisi LIKE '%[%'
        `);

        console.log(`✅ Deleted ${result.affectedRows} corrupted rows.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning data:', error);
        process.exit(1);
    }
}

cleanData();
