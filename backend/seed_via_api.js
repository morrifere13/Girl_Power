const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Pour les tests, nous utilisons un token admin (à obtenir via login)
let authToken = '';

// Données fictives (mêmes que seed_data.js)
const centres = [
    { nom: 'Centre Girl Power Abidjan', ville: 'Abidjan', region: 'Abidjan', adresse: 'Cocody, Rue des Jardins', capacite: 50, responsable: 'Aminata Koné', telephone: '+225 07 12 34 56 78', email: 'abidjan@girlpower.ci' },
    { nom: 'Centre Girl Power Bouaké', ville: 'Bouaké', region: 'Gbêkê', adresse: 'Quartier Commerce, Avenue Houphouët', capacite: 40, responsable: 'Fatoumata Diallo', telephone: '+225 07 23 45 67 89', email: 'bouake@girlpower.ci' },
    { nom: 'Centre Girl Power San Pedro', ville: 'San-Pédro', region: 'San-Pédro', adresse: 'Zone Industrielle, Rue du Port', capacite: 35, responsable: 'Mariam Traoré', telephone: '+225 07 34 56 78 90', email: 'sanpedro@girlpower.ci' },
    { nom: 'Centre Girl Power Korhogo', ville: 'Korhogo', region: 'Poro', adresse: 'Centre-ville, Boulevard de la Paix', capacite: 30, responsable: 'Aicha Ouattara', telephone: '+225 07 45 67 89 01', email: 'korhogo@girlpower.ci' },
    { nom: 'Centre Girl Power Yamoussoukro', ville: 'Yamoussoukro', region: 'Yamoussoukro', adresse: 'Quartier Habitat, Rue de la République', capacite: 45, responsable: 'Kadiatou Coulibaly', telephone: '+225 07 56 78 90 12', email: 'yamoussoukro@girlpower.ci' },
    { nom: 'Centre Girl Power Daloa', ville: 'Daloa', region: 'Haut-Sassandra', adresse: 'Tazibouo, Avenue des Écoles', capacite: 35, responsable: 'Ramatou Sanogo', telephone: '+225 07 67 89 01 23', email: 'daloa@girlpower.ci' },
    { nom: 'Centre Girl Power Man', ville: 'Man', region: 'Tonkpi', adresse: 'Centre-ville, Rue des Montagnes', capacite: 30, responsable: 'Salimata Diabaté', telephone: '+225 07 78 90 12 34', email: 'man@girlpower.ci' },
    { nom: 'Centre Girl Power Gagnoa', ville: 'Gagnoa', region: 'Gôh', adresse: 'Gnagbodougnoa, Boulevard Central', capacite: 25, responsable: 'Assétou Touré', telephone: '+225 07 89 01 23 45', email: 'gagnoa@girlpower.ci' },
    { nom: 'Centre Girl Power Abengourou', ville: 'Abengourou', region: 'Indénié-Djuablin', adresse: 'Quartier Résidentiel, Rue de la Comoé', capacite: 30, responsable: 'Hawa Camara', telephone: '+225 07 90 12 34 56', email: 'abengourou@girlpower.ci' },
    { nom: 'Centre Girl Power Divo', ville: 'Divo', region: 'Lôh-Djiboua', adresse: 'Centre Commercial, Avenue de la Paix', capacite: 25, responsable: 'Fatim Bamba', telephone: '+225 07 01 23 45 67', email: 'divo@girlpower.ci' },
    { nom: 'Centre Girl Power Bondoukou', ville: 'Bondoukou', region: 'Gontougo', adresse: 'Sorobango, Rue du Commerce', capacite: 20, responsable: 'Awa Konaté', telephone: '+225 07 12 34 56 78', email: 'bondoukou@girlpower.ci' },
    { nom: 'Centre Girl Power Séguéla', ville: 'Séguéla', region: 'Worodougou', adresse: 'Quartier Administratif, Boulevard Principal', capacite: 20, responsable: 'Mariama Doumbia', telephone: '+225 07 23 45 67 89', email: 'seguela@girlpower.ci' },
    { nom: 'Centre Girl Power Odienné', ville: 'Odienné', region: 'Kabadougou', adresse: 'Centre-ville, Avenue de la Liberté', capacite: 25, responsable: 'Djénéba Fofana', telephone: '+225 07 34 56 78 90', email: 'odienne@girlpower.ci' },
    { nom: 'Centre Girl Power Soubré', ville: 'Soubré', region: 'Nawa', adresse: 'Quartier Grand Marché, Rue Principale', capacite: 20, responsable: 'Bineta Cissé', telephone: '+225 07 45 67 89 01', email: 'soubre@girlpower.ci' },
    { nom: 'Centre Girl Power Grand-Bassam', ville: 'Grand-Bassam', region: 'Sud-Comoé', adresse: 'Zone Touristique, Boulevard de la Plage', capacite: 30, responsable: 'Aïssata Kaba', telephone: '+225 07 56 78 90 12', email: 'grandbassam@girlpower.ci' }
];

const projets = [
    { nom: 'Formation Couture & Mode', type: 'Formation Professionnelle', description: 'Formation complète en couture, stylisme et modélisme', objectifs: 'Former 200 jeunes femmes aux métiers de la couture', date_debut: '2024-01-15', date_fin: '2024-12-31', budget: 50000000, statut: 'EN_COURS' },
    { nom: 'Coiffure & Esthétique', type: 'Formation Professionnelle', description: 'Techniques de coiffure, maquillage et soins esthétiques', objectifs: 'Former 150 jeunes femmes aux métiers de la beauté', date_debut: '2024-02-01', date_fin: '2024-11-30', budget: 40000000, statut: 'EN_COURS' },
    { nom: 'Pâtisserie & Restauration', type: 'Formation Professionnelle', description: 'Formation aux métiers de la pâtisserie et restauration', objectifs: 'Former 100 jeunes femmes aux métiers de bouche', date_debut: '2024-03-01', date_fin: '2025-02-28', budget: 45000000, statut: 'EN_COURS' },
    { nom: 'Commerce & Vente', type: 'Formation Professionnelle', description: 'Techniques de vente, gestion de commerce et marketing', objectifs: 'Former 120 jeunes femmes au commerce', date_debut: '2024-01-20', date_fin: '2024-12-20', budget: 35000000, statut: 'EN_COURS' },
    { nom: 'Artisanat & Décoration', type: 'Formation Professionnelle', description: 'Création artisanale et décoration intérieure', objectifs: 'Former 80 jeunes femmes aux métiers artisanaux', date_debut: '2024-04-01', date_fin: '2025-03-31', budget: 30000000, statut: 'PLANIFIE' },
    { nom: 'Informatique Bureautique', type: 'Formation Professionnelle', description: 'Maîtrise des outils informatiques et bureautiques', objectifs: 'Former 150 jeunes femmes à l\'informatique', date_debut: '2024-02-15', date_fin: '2024-12-15', budget: 40000000, statut: 'EN_COURS' },
    { nom: 'Agriculture & Agro-alimentaire', type: 'Formation Professionnelle', description: 'Techniques agricoles et transformation agro-alimentaire', objectifs: 'Former 100 jeunes femmes à l\'agriculture', date_debut: '2024-05-01', date_fin: '2025-04-30', budget: 55000000, statut: 'PLANIFIE' },
    { nom: 'Électricité Bâtiment', type: 'Formation Professionnelle', description: 'Installation et maintenance électrique', objectifs: 'Former 60 jeunes femmes à l\'électricité', date_debut: '2024-03-15', date_fin: '2025-02-15', budget: 38000000, statut: 'EN_COURS' },
    { nom: 'Plomberie & Sanitaire', type: 'Formation Professionnelle', description: 'Installation sanitaire et plomberie', objectifs: 'Former 50 jeunes femmes à la plomberie', date_debut: '2024-06-01', date_fin: '2025-05-31', budget: 35000000, statut: 'PLANIFIE' },
    { nom: 'Mécanique Auto-Moto', type: 'Formation Professionnelle', description: 'Mécanique et entretien de véhicules', objectifs: 'Former 40 jeunes femmes à la mécanique', date_debut: '2024-04-15', date_fin: '2025-03-15', budget: 42000000, statut: 'PLANIFIE' },
    { nom: 'Menuiserie & Ébénisterie', type: 'Formation Professionnelle', description: 'Travail du bois et fabrication de meubles', objectifs: 'Former 70 jeunes femmes à la menuiserie', date_debut: '2024-03-01', date_fin: '2025-02-01', budget: 40000000, statut: 'EN_COURS' },
    { nom: 'Sérigraphie & Impression', type: 'Formation Professionnelle', description: 'Techniques d\'impression et sérigraphie', objectifs: 'Former 60 jeunes femmes à la sérigraphie', date_debut: '2024-05-15', date_fin: '2025-04-15', budget: 32000000, statut: 'PLANIFIE' },
    { nom: 'Hôtellerie & Tourisme', type: 'Formation Professionnelle', description: 'Accueil, service et gestion hôtelière', objectifs: 'Former 90 jeunes femmes à l\'hôtellerie', date_debut: '2024-02-01', date_fin: '2024-12-31', budget: 45000000, statut: 'EN_COURS' },
    { nom: 'Santé & Aide-Soignante', type: 'Formation Professionnelle', description: 'Formation aux métiers d\'aide-soignante', objectifs: 'Former 80 jeunes femmes aux soins', date_debut: '2024-06-15', date_fin: '2025-05-15', budget: 48000000, statut: 'PLANIFIE' },
    { nom: 'Secrétariat & Accueil', type: 'Formation Professionnelle', description: 'Secrétariat, accueil et gestion administrative', objectifs: 'Former 110 jeunes femmes au secrétariat', date_debut: '2024-01-10', date_fin: '2024-11-10', budget: 36000000, statut: 'EN_COURS' }
];

console.log('🌱 Seeding via API...\n');
console.log('⚠️  Assurez-vous que le serveur backend est démarré sur http://localhost:5000\n');
console.log('📝 Pour utiliser ce script:');
console.log('   1. Connectez-vous à l\'application');
console.log('   2. Ouvrez la console du navigateur (F12)');
console.log('   3. Tapez: localStorage.getItem("token")');
console.log('   4. Copiez le token');
console.log('   5. Exécutez: TOKEN="votre-token" node seed_via_api.js\n');

if (!process.env.TOKEN) {
    console.log('❌ Erreur: Token manquant');
    console.log('   Exécutez: TOKEN="votre-token" node seed_via_api.js');
    process.exit(1);
}

authToken = process.env.TOKEN;

console.log('✅ Token trouvé, démarrage du seeding...\n');

// Fonction pour créer les données via l'API
async function seedViaAPI() {
    try {
        const headers = { Authorization: `Bearer ${authToken}` };

        // 1. Créer les centres
        console.log('📍 Création des 15 centres...');
        const createdCentres = [];
        for (const centre of centres) {
            const response = await axios.post(`${API_URL}/centres`, centre, { headers });
            createdCentres.push(response.data);
            console.log(`   ✓ ${centre.nom}`);
        }
        console.log(`✅ ${createdCentres.length} centres créés\n`);

        // 2. Créer les projets
        console.log('📋 Création des 15 projets...');
        const createdProjets = [];
        for (let i = 0; i < projets.length; i++) {
            const projet = { ...projets[i], centre_id: createdCentres[i].id };
            const response = await axios.post(`${API_URL}/projects`, projet, { headers });
            createdProjets.push(response.data);
            console.log(`   ✓ ${projet.nom}`);
        }
        console.log(`✅ ${createdProjets.length} projets créés\n`);

        // 3. Créer 2 cohortes par projet (30 cohortes)
        console.log('👥 Création des cohortes (2 par projet)...');
        const createdCohortes = [];
        for (const projet of createdProjets) {
            // Cohorte 1
            const cohorte1 = {
                nom: `Cohorte 1 - ${projet.nom}`,
                projet_id: projet.id,
                date_debut: '2024-01-15',
                date_fin: '2024-06-30',
                capacite: 25,
                statut: 'EN_COURS'
            };
            const response1 = await axios.post(`${API_URL}/cohortes`, cohorte1, { headers });
            createdCohortes.push(response1.data);

            // Cohorte 2
            const cohorte2 = {
                nom: `Cohorte 2 - ${projet.nom}`,
                projet_id: projet.id,
                date_debut: '2024-07-01',
                date_fin: '2024-12-31',
                capacite: 25,
                statut: 'EN_COURS'
            };
            const response2 = await axios.post(`${API_URL}/cohortes`, cohorte2, { headers });
            createdCohortes.push(response2.data);
            console.log(`   ✓ 2 cohortes pour ${projet.nom}`);
        }
        console.log(`✅ ${createdCohortes.length} cohortes créées\n`);

        // 4. Créer 15 candidates
        console.log('👩 Création des 15 candidates...');
        const prenoms = ['Aya', 'Aminata', 'Fatoumata', 'Mariam', 'Kadiatou', 'Ramatou', 'Salimata', 'Assétou', 'Hawa', 'Fatim', 'Awa', 'Mariama', 'Djénéba', 'Bineta', 'Aïssata'];
        const noms = ['Koné', 'Diallo', 'Traoré', 'Ouattara', 'Coulibaly', 'Sanogo', 'Diabaté', 'Touré', 'Camara', 'Bamba', 'Konaté', 'Doumbia', 'Fofana', 'Cissé', 'Kaba'];
        const villes = ['Abidjan', 'Bouaké', 'San-Pédro', 'Korhogo', 'Yamoussoukro', 'Daloa', 'Man', 'Gagnoa', 'Abengourou', 'Divo', 'Bondoukou', 'Séguéla', 'Odienné', 'Soubré', 'Grand-Bassam'];
        const regions = ['Abidjan', 'Gbêkê', 'San-Pédro', 'Poro', 'Yamoussoukro', 'Haut-Sassandra', 'Tonkpi', 'Gôh', 'Indénié-Djuablin', 'Lôh-Djiboua', 'Gontougo', 'Worodougou', 'Kabadougou', 'Nawa', 'Sud-Comoé'];
        const statuts = ['En attente', 'En attente', 'En attente', 'En attente', 'Acceptée', 'Acceptée', 'Refusée', 'En formation', 'En attente', 'En attente', 'Acceptée', 'En attente', 'En attente', 'Acceptée', 'En attente'];

        for (let i = 0; i < 15; i++) {
            const candidate = {
                nom: noms[i],
                prenom: prenoms[i],
                date_naissance: `200${i % 7}-0${(i % 12) + 1}-15`,
                sexe: 'F',
                telephone: `+225 07 ${Math.floor(Math.random() * 90000000 + 10000000)}`,
                email: `${prenoms[i].toLowerCase()}.${noms[i].toLowerCase()}@email.ci`,
                adresse: `Quartier ${i + 1}, Rue ${i + 1}`,
                ville: villes[i],
                region: regions[i],
                niveau_etude: ['Primaire', 'Collège', 'Lycée', 'BAC'][i % 4],
                situation_matrimoniale: ['Célibataire', 'Mariée', 'Divorcée'][i % 3],
                nombre_enfants: i % 4,
                projet_id: createdProjets[i].id,
                cohorte_id: createdCohortes[i * 2].id,
                statut: statuts[i]
            };

            await axios.post(`${API_URL}/candidates`, candidate, { headers });
            console.log(`   ✓ ${candidate.prenom} ${candidate.nom} (${candidate.statut})`);
        }
        console.log(`✅ 15 candidates créées\n`);

        console.log('🎉 Seeding terminé avec succès!\n');
        console.log('📊 Résumé:');
        console.log(`   - ${createdCentres.length} centres`);
        console.log(`   - ${createdProjets.length} projets`);
        console.log(`   - ${createdCohortes.length} cohortes`);
        console.log(`   - 15 candidates`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
        process.exit(1);
    }
}

seedViaAPI();
