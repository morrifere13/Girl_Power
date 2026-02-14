/**
 * Script pour créer les données d'affectation (projets, cohortes, centres)
 * correspondant aux IDs référencés dans les candidats
 */
const db = require('../config/db');

async function seedAffectation() {
    console.log('🌱 Insertion des données d\'affectation...\n');

    try {
        // ============================================
        // 1. CENTRES (id: 1, 2)
        // ============================================
        console.log('🏢 Création des centres...');

        // Vérifier si les centres existent déjà
        const [existingCentres] = await db.query('SELECT id FROM centres WHERE id IN (1, 2)');
        const existingCentreIds = existingCentres.map(c => c.id);

        if (!existingCentreIds.includes(1)) {
            await db.query(`
                INSERT INTO centres (id, code, nom, type_centre, region, ville, adresse, capacite_accueil, statut, telephone, email, responsable_nom)
                VALUES (1, 'CTR-CKY-001', 'Centre de Formation de Conakry', 'Centre Principal', 'Conakry', 'Ratoma', 'Kipé, près du marché central', 150, 'ACTIF', '62100100', 'conakry@girlpower.gn', 'Mme Fatou CAMARA')
            `);
            console.log('   ✅ Centre 1 (Conakry) créé');
        } else {
            console.log('   ⏭️ Centre 1 existe déjà');
        }

        if (!existingCentreIds.includes(2)) {
            await db.query(`
                INSERT INTO centres (id, code, nom, type_centre, region, ville, adresse, capacite_accueil, statut, telephone, email, responsable_nom)
                VALUES (2, 'CTR-KDI-002', 'Centre de Formation de Kindia', 'Centre Régional', 'Kindia', 'Kindia', 'Quartier Manquepas, Route nationale', 100, 'ACTIF', '62200200', 'kindia@girlpower.gn', 'M. Mamadou DIALLO')
            `);
            console.log('   ✅ Centre 2 (Kindia) créé');
        } else {
            console.log('   ⏭️ Centre 2 existe déjà');
        }

        // ============================================
        // 2. PROJETS (id: 2)
        // ============================================
        console.log('\n📁 Création des projets...');

        const [existingProjects] = await db.query('SELECT id FROM projects WHERE id IN (1, 2)');
        const existingProjectIds = existingProjects.map(p => p.id);

        if (!existingProjectIds.includes(1)) {
            await db.query(`
                INSERT INTO projects (id, code, nom, description, date_debut, date_fin, duree_mois, statut)
                VALUES (1, 'GP-2024-001', 'Girl Power Phase 1', 'Programme pilote de formation professionnelle pour les jeunes femmes', '2024-01-01', '2024-12-31', 12, 'CLOTURE')
            `);
            console.log('   ✅ Projet 1 (Phase 1) créé');
        } else {
            console.log('   ⏭️ Projet 1 existe déjà');
        }

        if (!existingProjectIds.includes(2)) {
            await db.query(`
                INSERT INTO projects (id, code, nom, description, date_debut, date_fin, duree_mois, statut, bailleurs, partenaires, zones_intervention)
                VALUES (
                    2,
                    'GP-2025-002',
                    'Girl Power Phase 2 - Extension',
                    'Extension du programme Girl Power avec de nouveaux centres et métiers',
                    '2025-01-01',
                    '2026-06-30',
                    18,
                    'EN_COURS',
                    '["Banque Mondiale", "USAID", "Union Européenne"]',
                    '["Ministère de la Formation", "ONG Partenaires", "Secteur Privé"]',
                    '["Conakry", "Kindia", "Labé", "Kankan", "N\\'Zérékoré"]'
                )
            `);
            console.log('   ✅ Projet 2 (Phase 2 - Extension) créé');
        } else {
            console.log('   ⏭️ Projet 2 existe déjà');
        }

        // ============================================
        // 3. COHORTES (id: 1, 2, 3, 4)
        // ============================================
        console.log('\n👥 Création des cohortes...');

        const [existingCohortes] = await db.query('SELECT id FROM cohortes WHERE id IN (1, 2, 3, 4)');
        const existingCohorteIds = existingCohortes.map(c => c.id);

        const cohortes = [
            {
                id: 1,
                code: 'COH-2025-001',
                nom: 'Cohorte Conakry Janvier 2025',
                projet_id: 2,
                centre_id: 1,
                region: 'Conakry',
                date_debut_recrutement: '2024-11-01',
                date_fin_recrutement: '2024-12-31',
                date_entree_centre: '2025-01-15',
                date_fin_formation: '2025-07-15',
                statut: 'EN_COURS'
            },
            {
                id: 2,
                code: 'COH-2025-002',
                nom: 'Cohorte Labé Février 2025',
                projet_id: 2,
                centre_id: 1,
                region: 'Labé',
                date_debut_recrutement: '2024-12-01',
                date_fin_recrutement: '2025-01-31',
                date_entree_centre: '2025-02-15',
                date_fin_formation: '2025-08-15',
                statut: 'EN_COURS'
            },
            {
                id: 3,
                code: 'COH-2025-003',
                nom: 'Cohorte Kankan Mars 2025',
                projet_id: 2,
                centre_id: 2,
                region: 'Kankan',
                date_debut_recrutement: '2025-01-01',
                date_fin_recrutement: '2025-02-28',
                date_entree_centre: '2025-03-15',
                date_fin_formation: '2025-09-15',
                statut: 'EN_COURS'
            },
            {
                id: 4,
                code: 'COH-2025-004',
                nom: 'Cohorte N\'Zérékoré Avril 2025',
                projet_id: 2,
                centre_id: 2,
                region: 'N\'Zérékoré',
                date_debut_recrutement: '2025-02-01',
                date_fin_recrutement: '2025-03-31',
                date_entree_centre: '2025-04-15',
                date_fin_formation: '2025-10-15',
                statut: 'EN_COURS'
            }
        ];

        for (const cohorte of cohortes) {
            if (!existingCohorteIds.includes(cohorte.id)) {
                await db.query(`
                    INSERT INTO cohortes (id, code, nom, projet_id, centre_id, region, date_debut_recrutement, date_fin_recrutement, date_entree_centre, date_fin_formation, statut)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    cohorte.id, cohorte.code, cohorte.nom, cohorte.projet_id, cohorte.centre_id,
                    cohorte.region, cohorte.date_debut_recrutement, cohorte.date_fin_recrutement,
                    cohorte.date_entree_centre, cohorte.date_fin_formation, cohorte.statut
                ]);
                console.log(`   ✅ Cohorte ${cohorte.id} (${cohorte.nom}) créée`);
            } else {
                console.log(`   ⏭️ Cohorte ${cohorte.id} existe déjà`);
            }
        }

        // ============================================
        // Résumé
        // ============================================
        console.log('\n✨ Données d\'affectation créées avec succès!');
        console.log('\n📊 Résumé:');
        console.log('   - 2 centres (Conakry, Kindia)');
        console.log('   - 2 projets (Phase 1 clôturée, Phase 2 en cours)');
        console.log('   - 4 cohortes (Conakry, Labé, Kankan, N\'Zérékoré)');
        console.log('\n🔗 Les candidats existants devraient maintenant avoir leurs affectations visibles.');

    } catch (error) {
        console.error('❌ Erreur lors de l\'insertion:', error.message);
        console.error(error);
    } finally {
        process.exit(0);
    }
}

seedAffectation();
