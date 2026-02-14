const db = require('./config/db');

async function clearAllData() {
    try {
        console.log('🗑️  Début de la suppression des données...\n');

        // Désactiver les vérifications de clés étrangères
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('✓ Désactivation des contraintes de clés étrangères');

        // 1. Supprimer les enfants
        const [enfantsResult] = await db.query('DELETE FROM enfants');
        console.log(`✓ Table enfants vidée (${enfantsResult.affectedRows || 0} lignes supprimées)`);

        // 2. Supprimer les candidates
        const [candidatesResult] = await db.query('DELETE FROM candidates');
        console.log(`✓ Table candidates vidée (${candidatesResult.affectedRows || 0} lignes supprimées)`);

        // 3. Supprimer les tables de liaison projet-centre
        try {
            const [projectCentresResult] = await db.query('DELETE FROM project_centres');
            console.log(`✓ Table project_centres vidée (${projectCentresResult.affectedRows || 0} lignes supprimées)`);
        } catch (err) {
            console.log('⚠️  Table project_centres n\'existe pas ou est déjà vide');
        }

        // 4. Supprimer les cohortes
        try {
            const [cohortesResult] = await db.query('DELETE FROM cohortes');
            console.log(`✓ Table cohortes vidée (${cohortesResult.affectedRows || 0} lignes supprimées)`);
        } catch (err) {
            console.log('⚠️  Table cohortes n\'existe pas ou est déjà vide');
        }

        // 5. Supprimer les projets
        try {
            const [projectsResult] = await db.query('DELETE FROM projects');
            console.log(`✓ Table projects vidée (${projectsResult.affectedRows || 0} lignes supprimées)`);
        } catch (err) {
            console.log('⚠️  Table projects n\'existe pas ou est déjà vide');
        }

        // 6. Supprimer les métiers des centres
        try {
            const [centreMetiersResult] = await db.query('DELETE FROM centre_metiers');
            console.log(`✓ Table centre_metiers vidée (${centreMetiersResult.affectedRows || 0} lignes supprimées)`);
        } catch (err) {
            console.log('⚠️  Table centre_metiers n\'existe pas ou est déjà vide');
        }

        // 7. Supprimer les centres
        try {
            const [centresResult] = await db.query('DELETE FROM centres');
            console.log(`✓ Table centres vidée (${centresResult.affectedRows || 0} lignes supprimées)`);
        } catch (err) {
            console.log('⚠️  Table centres n\'existe pas ou est déjà vide');
        }

        // Réactiver les vérifications de clés étrangères
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✓ Réactivation des contraintes de clés étrangères');

        // Réinitialiser les auto-increment
        console.log('\n📊 Réinitialisation des compteurs AUTO_INCREMENT...');
        await db.query('ALTER TABLE enfants AUTO_INCREMENT = 1');
        await db.query('ALTER TABLE candidates AUTO_INCREMENT = 1');

        try {
            await db.query('ALTER TABLE cohortes AUTO_INCREMENT = 1');
            await db.query('ALTER TABLE projects AUTO_INCREMENT = 1');
            await db.query('ALTER TABLE centres AUTO_INCREMENT = 1');
            await db.query('ALTER TABLE centre_metiers AUTO_INCREMENT = 1');
        } catch (err) {
            // Ignorer les erreurs si les tables n'existent pas
        }

        console.log('\n✅ Toutes les données ont été supprimées avec succès!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Erreur lors de la suppression des données:', error.message);
        process.exit(1);
    }
}

// Confirmation avant suppression
console.log('⚠️  ATTENTION: Cette opération va supprimer TOUTES les données des tables:');
console.log('   - candidates');
console.log('   - enfants');
console.log('   - projets (projects)');
console.log('   - centres');
console.log('   - cohortes');
console.log('   - centre_metiers');
console.log('   - project_centres\n');

clearAllData();
