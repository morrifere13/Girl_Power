const db = require('./config/db');

async function addAllMedicalFields() {
    const connection = await db.getConnection();
    try {
        console.log('🏥 Ajout de TOUS les champs médicaux complets...\n');

        const fields = [
            // Informations de visite
            { name: 'ville_visite', type: 'VARCHAR(100)', comment: 'Ville où a lieu la visite' },

            // Mesures complémentaires
            { name: 'pouls', type: 'VARCHAR(20)', comment: 'Pouls en bpm' },
            { name: 'pignet', type: 'DECIMAL(5,2)', comment: 'Indice de Pignet' },

            // Examens cliniques
            { name: 'av', type: 'VARCHAR(50)', comment: 'Acuité visuelle' },
            { name: 'vision', type: 'TEXT', comment: 'Examen vision' },
            { name: 'audition', type: 'TEXT', comment: 'Examen audition' },
            { name: 'buccodentaire', type: 'TEXT', comment: 'Examen buccodentaire' },
            { name: 'bdc', type: 'TEXT', comment: 'Bruits du cœur' },
            { name: 'peau', type: 'TEXT', comment: 'Examen de la peau' },

            // Examens par systèmes
            { name: 'coeur_poumons', type: 'TEXT', comment: 'Examen cœur et poumons' },
            { name: 'abdomen', type: 'TEXT', comment: 'Examen abdominal' },
            { name: 'membres_superieurs', type: 'TEXT', comment: 'Examen membres supérieurs' },
            { name: 'membres_inferieurs', type: 'TEXT', comment: 'Examen membres inférieurs' },

            // État général
            { name: 'etat_general', type: 'VARCHAR(50)', comment: 'État général: Bon/Moyen/Mauvais' },
            { name: 'asthmatique', type: 'BOOLEAN', comment: 'Patient asthmatique', default: 'FALSE' },
            { name: 'handicap', type: 'BOOLEAN', comment: 'Présence handicap', default: 'FALSE' },
            { name: 'grossesse', type: 'BOOLEAN', comment: 'Grossesse confirmée', default: 'FALSE' }
        ];

        for (const field of fields) {
            try {
                let sql = `ALTER TABLE visites_medicales ADD COLUMN ${field.name} ${field.type}`
                if (field.default) sql += ` DEFAULT ${field.default}`
                if (field.comment) sql += ` COMMENT '${field.comment}'`

                await connection.query(sql);
                console.log(`✅ ${field.name} ajouté`);
            } catch (e) {
                if (e.message.includes('Duplicate column')) {
                    console.log(`ℹ️  ${field.name} existe déjà`);
                } else {
                    console.error(`❌ Erreur pour ${field.name}:`, e.message);
                }
            }
        }

        console.log('\n🎉 Tous les champs médicaux ont été ajoutés!');
        console.log('\n📋 Champs disponibles:');
        console.log('   - Informations visite: ville_visite');
        console.log('   - Mesures: taille, poids, IMC, température, TA, pouls, pignet');
        console.log('   - Examens sensoriels: AV, vision, audition');
        console.log('   - Examens physiques: buccodentaire, BDC, peau');
        console.log('   - Examens systèmes: cœur_poumons, abdomen, membres');
        console.log('   - État: etat_general, asthmatique, handicap, grossesse');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

addAllMedicalFields();
