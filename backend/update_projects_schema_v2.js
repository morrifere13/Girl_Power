const db = require('./config/db');

async function updateProjectsSchemaV2() {
    try {
        console.log('🏗️ Updating Projects table schema (V2)...');

        // Add Target Audience and Countries
        const columns = [
            "genre_cible ENUM('FEMME', 'HOMME', 'MIXTE') DEFAULT 'MIXTE'",
            "pays_cible JSON"
        ];

        for (const col of columns) {
            try {
                await db.query(`ALTER TABLE projects ADD COLUMN ${col}`);
                console.log(`   + Added ${col.split(' ')[0]}`);
            } catch (err) {
                if (err.code !== 'ER_DUP_FIELDNAME') {
                    // console.warn(`   = Validated ${col.split(' ')[0]}`);
                }
            }
        }

        console.log('✅ Projects schema updated successfully (V2)!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating schema:', error);
        process.exit(1);
    }
}

updateProjectsSchemaV2();
