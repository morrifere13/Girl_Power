const db = require('./config/db');

async function inspect() {
    try {
        console.log('🔍 Inspecting Database Content...');

        const [centres] = await db.query('SELECT id, nom FROM centres WHERE deleted_at IS NULL');
        console.log(`\nFound ${centres.length} centres:`);

        for (const c of centres) {
            const [metiers] = await db.query('SELECT * FROM centre_metiers WHERE centre_id = ?', [c.id]);
            console.log(`\n🏫 Centre [${c.id}] ${c.nom}:`);
            if (metiers.length === 0) {
                console.log('   (No metiers found)');
            } else {
                metiers.forEach(m => {
                    console.log(`   - ID: ${m.id} | Métier: "${m.metier_choisi}" | Cap: ${m.capacite_max}`);
                });
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspect();
