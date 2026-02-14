/**
 * Script pour tester les données d'affectation
 */
const db = require('../config/db');

async function testAffectation() {
    try {
        console.log('\n📊 Test des candidats avec affectation:\n');

        const [candidates] = await db.query(`
            SELECT
                c.id, c.nom, c.prenom, c.projet_id, c.cohorte_id, c.centre_id,
                p.nom as projet_nom, p.code as projet_code,
                coh.nom as cohorte_nom, coh.code as cohorte_code,
                cent.nom as centre_nom
            FROM candidates c
            LEFT JOIN projects p ON c.projet_id = p.id
            LEFT JOIN cohortes coh ON c.cohorte_id = coh.id
            LEFT JOIN centres cent ON c.centre_id = cent.id
            WHERE c.projet_id IS NOT NULL OR c.cohorte_id IS NOT NULL OR c.centre_id IS NOT NULL
            LIMIT 10
        `);

        if (candidates.length === 0) {
            console.log('❌ Aucun candidat avec affectation trouvé');
        } else {
            candidates.forEach(c => {
                console.log(`ID ${c.id}: ${c.prenom} ${c.nom}`);
                console.log(`   Projet: ${c.projet_id} -> "${c.projet_nom || 'NULL'}" (${c.projet_code || 'NULL'})`);
                console.log(`   Cohorte: ${c.cohorte_id} -> "${c.cohorte_nom || 'NULL'}" (${c.cohorte_code || 'NULL'})`);
                console.log(`   Centre: ${c.centre_id} -> "${c.centre_nom || 'NULL'}"`);
                console.log('');
            });
        }

        // Vérifier les tables
        console.log('\n📋 Vérification des tables:');

        const [projects] = await db.query('SELECT id, code, nom FROM projects LIMIT 5');
        console.log('\nProjets:', projects.map(p => `${p.id}: ${p.nom}`).join(', ') || 'Aucun');

        const [cohortes] = await db.query('SELECT id, code, nom FROM cohortes LIMIT 5');
        console.log('Cohortes:', cohortes.map(c => `${c.id}: ${c.nom}`).join(', ') || 'Aucune');

        const [centres] = await db.query('SELECT id, code, nom FROM centres LIMIT 5');
        console.log('Centres:', centres.map(c => `${c.id}: ${c.nom}`).join(', ') || 'Aucun');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        process.exit(0);
    }
}

testAffectation();
