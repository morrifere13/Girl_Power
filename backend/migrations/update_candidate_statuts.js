/**
 * Migration: Mise à jour des statuts candidat selon le parcours
 *
 * Nouveau parcours:
 * 1. Inscrit → Candidat vient de s'inscrire
 * 2. Sélectionné → Critères remplis, en attente de visite médicale
 * 3. Rejeté → Critères non remplis
 * 4. Apte → Visite médicale positive
 * 5. Inapte → Visite médicale négative
 * 6. Admis → Admis en formation
 */

const db = require('../config/db');

async function migrate() {
    console.log('🚀 Démarrage de la migration des statuts candidat...\n');

    try {
        // 1. Modifier l'ENUM de la colonne statut
        console.log('📝 Modification de l\'ENUM statut...');

        await db.query(`
            ALTER TABLE candidates
            MODIFY COLUMN statut ENUM(
                'Inscrit',
                'Sélectionné',
                'Rejeté',
                'Apte',
                'Inapte',
                'Admis'
            ) DEFAULT 'Inscrit'
        `);
        console.log('✅ ENUM statut mis à jour\n');

        // 2. Migrer les anciens statuts vers les nouveaux
        console.log('🔄 Migration des données existantes...');

        // En attente → Inscrit
        const [result1] = await db.query(`
            UPDATE candidates SET statut = 'Inscrit'
            WHERE statut = 'En attente' OR statut IS NULL
        `);
        console.log(`   - "En attente" → "Inscrit": ${result1.affectedRows} candidat(s)`);

        // Acceptée → Sélectionné (ils doivent passer la visite médicale)
        const [result2] = await db.query(`
            UPDATE candidates SET statut = 'Sélectionné'
            WHERE statut = 'Acceptée'
        `);
        console.log(`   - "Acceptée" → "Sélectionné": ${result2.affectedRows} candidat(s)`);

        // Refusée → Rejeté
        const [result3] = await db.query(`
            UPDATE candidates SET statut = 'Rejeté'
            WHERE statut = 'Refusée'
        `);
        console.log(`   - "Refusée" → "Rejeté": ${result3.affectedRows} candidat(s)`);

        // En formation → Admis
        const [result4] = await db.query(`
            UPDATE candidates SET statut = 'Admis'
            WHERE statut = 'En formation'
        `);
        console.log(`   - "En formation" → "Admis": ${result4.affectedRows} candidat(s)`);

        // 3. Mettre à jour les candidats avec visite médicale validée → Apte
        console.log('\n🏥 Synchronisation avec les visites médicales...');

        const [result5] = await db.query(`
            UPDATE candidates c
            INNER JOIN visites_medicales vm ON c.id = vm.candidate_id
            SET c.statut = 'Apte'
            WHERE vm.statut = 'VALIDE'
            AND vm.deleted_at IS NULL
            AND c.statut = 'Sélectionné'
        `);
        console.log(`   - Visite VALIDE → "Apte": ${result5.affectedRows} candidat(s)`);

        // Candidats avec visite médicale rejetée → Inapte
        const [result6] = await db.query(`
            UPDATE candidates c
            INNER JOIN visites_medicales vm ON c.id = vm.candidate_id
            SET c.statut = 'Inapte'
            WHERE vm.statut = 'REJETE'
            AND vm.deleted_at IS NULL
            AND c.statut = 'Sélectionné'
        `);
        console.log(`   - Visite REJETE → "Inapte": ${result6.affectedRows} candidat(s)`);

        console.log('\n✅ Migration terminée avec succès!');
        console.log('\n📊 Récapitulatif des statuts:');

        const [stats] = await db.query(`
            SELECT statut, COUNT(*) as total
            FROM candidates
            GROUP BY statut
            ORDER BY FIELD(statut, 'Inscrit', 'Sélectionné', 'Rejeté', 'Apte', 'Inapte', 'Admis')
        `);

        stats.forEach(s => {
            console.log(`   - ${s.statut}: ${s.total} candidat(s)`);
        });

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur lors de la migration:', error.message);
        process.exit(1);
    }
}

migrate();
