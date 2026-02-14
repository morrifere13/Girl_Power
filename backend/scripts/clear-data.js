/**
 * Script pour vider les données de test
 * Usage: node scripts/clear-data.js
 */

const db = require('../config/db');

async function clearAllData() {
    console.log('🗑️  Suppression de toutes les données de test...\n');

    try {
        // Désactiver les vérifications de clés étrangères temporairement
        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        // Liste des tables à vider (ordre important pour les dépendances)
        const tables = [
            'visites_medicales',
            'candidate_fichiers',
            'candidate_diplomes',
            'enfants',
            'stages',
            'candidates',
            'cohortes',
            'centres',
            'projects',
            'entreprises'
        ];

        for (const table of tables) {
            try {
                const [result] = await db.query(`DELETE FROM ${table}`);
                console.log(`✅ ${table}: ${result.affectedRows} enregistrements supprimés`);

                // Réinitialiser l'auto-increment
                await db.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
            } catch (err) {
                if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.log(`⚠️  ${table}: table non trouvée (ignorée)`);
                } else {
                    console.log(`❌ ${table}: erreur - ${err.message}`);
                }
            }
        }

        // Réactiver les vérifications de clés étrangères
        await db.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n✨ Toutes les données ont été supprimées avec succès!');
        console.log('📊 Les tables sont maintenant vides et prêtes pour de nouvelles données.\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        process.exit(0);
    }
}

// Confirmation avant suppression
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n⚠️  ATTENTION: Cette action va supprimer TOUTES les données des tables suivantes:');
console.log('   - visites_medicales');
console.log('   - candidates (et fichiers, diplômes, enfants associés)');
console.log('   - cohortes');
console.log('   - centres');
console.log('   - projects');
console.log('   - entreprises');
console.log('   - stages\n');

rl.question('Êtes-vous sûr de vouloir continuer? (oui/non): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o') {
        clearAllData();
    } else {
        console.log('❌ Opération annulée.\n');
        process.exit(0);
    }
});
