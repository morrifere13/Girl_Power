require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
    let connection;

    try {
        console.log('\n🔌 Connexion à la base de données...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ Connecté à:', process.env.DB_NAME);

        // Lire et exécuter chaque migration séparément

        // Migration 005: Stages
        console.log('\n📄 Création de la table stages...');
        const stage005 = await fs.readFile(
            path.join(__dirname, '../migrations/005_create_stages.sql'),
            'utf8'
        );
        await connection.query(stage005);
        console.log('✅ Table stages créée');

        // Migration 006: Stage Evaluations
        console.log('\n📄 Création de la table stage_evaluations...');
        const stage006 = await fs.readFile(
            path.join(__dirname, '../migrations/006_create_stage_evaluations.sql'),
            'utf8'
        );
        await connection.query(stage006);
        console.log('✅ Table stage_evaluations créée');

        // Migration 007: Update Candidates
        console.log('\n📄 Mise à jour de la table candidates...');
        const stage007 = await fs.readFile(
            path.join(__dirname, '../migrations/007_update_candidates_for_stages.sql'),
            'utf8'
        );

        // Exécuter ligne par ligne pour gérer les erreurs
        const lines = stage007.split(';').filter(l => l.trim());
        for (const line of lines) {
            if (line.trim()) {
                try {
                    await connection.query(line);
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME') {
                        console.log('   ⚠️  Colonne existe déjà, ignoré');
                    } else if (err.code === 'ER_DUP_KEYNAME') {
                        console.log('   ⚠️  Index existe déjà, ignoré');
                    } else {
                        throw err;
                    }
                }
            }
        }
        console.log('✅ Table candidates mise à jour');

        // Vérifications
        console.log('\n🔍 Vérification des tables créées...');
        const [tables] = await connection.query(`
            SHOW TABLES LIKE '%stage%'
        `);
        tables.forEach(t => console.log('   ✓', Object.values(t)[0]));

        console.log('\n✨ MIGRATIONS TERMINÉES AVEC SUCCÈS!\n');

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        if (error.code) console.error('Code:', error.code);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runMigrations();
