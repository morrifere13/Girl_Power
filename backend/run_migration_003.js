const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connection = await db.getConnection();
    try {
        console.log('🏗️  Exécution de la migration 003: Relations candidates...\n');

        // Lire le fichier SQL
        const sqlFile = path.join(__dirname, 'migrations', '003_add_relations_to_candidates.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Séparer les commandes SQL
        const commands = sql
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        // Exécuter chaque commande
        for (const command of commands) {
            try {
                await connection.query(command);
                console.log('✅', command.substring(0, 60) + '...');
            } catch (error) {
                if (error.message.includes('Duplicate column') || error.message.includes('Duplicate key')) {
                    console.log('ℹ️  Déjà existant:', command.substring(0, 60) + '...');
                } else {
                    throw error;
                }
            }
        }

        console.log('\n🎉 Migration 003 terminée avec succès!');
        console.log('\n📋 Colonnes ajoutées:');
        console.log('   - centre_id (INT, FK vers centres)');
        console.log('   - projet_id (INT, FK vers projects)');
        console.log('   - cohorte_id (INT, FK vers cohortes)');
        console.log('\n💡 Chaque candidate peut maintenant être liée à:');
        console.log('   - 1 centre unique');
        console.log('   - 1 projet unique');
        console.log('   - 1 cohorte unique');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur lors de la migration:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

runMigration();
