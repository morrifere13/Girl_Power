const db = require('./config/db');

// Données complètes et réalistes pour 50 candidates
const candidatesData = [
    // Abidjan - 10 candidates
    { nom: 'KONÉ', prenom: 'Aya', surnom: 'Yaya', date_naissance: '2001-03-15', lieu_naissance: 'Abidjan', sexe: 'F', telephone: '+225 07 45 23 67 89', telephone_2: '+225 05 12 34 56 78', email: 'aya.kone@gmail.com', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Cocody', repere_logement: 'Près de la pharmacie', adresse: 'Cocody Riviera', prix_transport: 500, type_document: 'CNI', numero_document: 'CI2021000123', nni: null, date_validite_document: '2026-03-15', cmu: '1234567890', aej_numero: 'AEJ2024001', niveau_etude: 'BAC', diplome: 'BAC D', annee_diplome: '2020', metier_choisi: 'Couture', activite_actuelle: 'Petits travaux', revenu_mensuel: 50000, plus_grande_somme_gere: 200000, situation_matrimoniale: 'Célibataire', a_des_enfants: 'Non', nombre_enfants: 0, nombre_enfants_charge: 0, enfants_au_centre: 'Non', pere_vivant: 'Oui', pere_nom: 'KONÉ Moussa', pere_profession: 'Chauffeur', pere_contact1: '+225 07 11 22 33 44', pere_contact2: null, mere_vivante: 'Oui', mere_nom: 'KONÉ née DIALLO Fatoumata', mere_profession: 'Commerçante', mere_contact1: '+225 07 55 66 77 88', mere_contact2: null, urgence_nom: 'KONÉ Moussa', urgence_affiliation: 'Père', urgence_profession: 'Chauffeur', urgence_contact1: '+225 07 11 22 33 44', urgence_contact2: null, statut: 'En attente' },

    { nom: 'DIALLO', prenom: 'Aminata', surnom: 'Mina', date_naissance: '2000-07-22', lieu_naissance: 'Bouaké', sexe: 'F', telephone: '+225 07 78 90 12 34', telephone_2: '+225 05 23 45 67 89', email: 'aminata.diallo@yahoo.fr', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Yopougon', repere_logement: 'Face au marché', adresse: 'Yopougon Niangon', prix_transport: 400, type_document: 'CNI', numero_document: 'CI2020000456', nni: null, date_validite_document: '2025-07-22', cmu: '2345678901', aej_numero: 'AEJ2024002', niveau_etude: 'Collège', diplome: 'BEPC', annee_diplome: '2018', metier_choisi: 'Coiffure', activite_actuelle: 'Sans emploi', revenu_mensuel: 0, plus_grande_somme_gere: 100000, situation_matrimoniale: 'Célibataire', a_des_enfants: 'Oui', nombre_enfants: 1, nombre_enfants_charge: 1, enfants_au_centre: 'Oui', pere_vivant: 'Non', pere_nom: null, pere_profession: null, pere_contact1: null, pere_contact2: null, mere_vivante: 'Oui', mere_nom: 'DIALLO Kadiatou', mere_profession: 'Ménagère', mere_contact1: '+225 07 88 99 00 11', mere_contact2: null, urgence_nom: 'DIALLO Kadiatou', urgence_affiliation: 'Mère', urgence_profession: 'Ménagère', urgence_contact1: '+225 07 88 99 00 11', urgence_contact2: null, statut: 'En attente' },

    { nom: 'TRAORÉ', prenom: 'Mariam', surnom: 'Mimi', date_naissance: '2002-01-10', lieu_naissance: 'Abidjan', sexe: 'F', telephone: '+225 07 34 56 78 90', telephone_2: null, email: 'mariam.traore@outlook.com', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Abobo', repere_logement: 'Derrière l\'école', adresse: 'Abobo Gare', prix_transport: 300, type_document: 'CNI', numero_document: 'CI2022000789', nni: null, date_validite_document: '2027-01-10', cmu: '3456789012', aej_numero: 'AEJ2024003', niveau_etude: 'Lycée', diplome: '1ère D', annee_diplome: '2021', metier_choisi: 'Pâtisserie', activite_actuelle: 'Aide familiale', revenu_mensuel: 30000, plus_grande_somme_gere: 150000, situation_matrimoniale: 'Célibataire', a_des_enfants: 'Non', nombre_enfants: 0, nombre_enfants_charge: 0, enfants_au_centre: 'Non', pere_vivant: 'Oui', pere_nom: 'TRAORÉ Ibrahim', pere_profession: 'Mécanicien', pere_contact1: '+225 07 22 33 44 55', pere_contact2: '+225 05 66 77 88 99', mere_vivante: 'Oui', mere_nom: 'TRAORÉ née SANOGO Aïssata', mere_profession: 'Vendeuse', mere_contact1: '+225 07 99 88 77 66', mere_contact2: null, urgence_nom: 'TRAORÉ Ibrahim', urgence_affiliation: 'Père', urgence_profession: 'Mécanicien', urgence_contact1: '+225 07 22 33 44 55', urgence_contact2: '+225 05 66 77 88 99', statut: 'En attente' },

    { nom: 'OUATTARA', prenom: 'Fatoumata', surnom: 'Fati', date_naissance: '1999-11-05', lieu_naissance: 'Korhogo', sexe: 'F', telephone: '+225 07 56 78 90 12', telephone_2: '+225 05 34 56 78 90', email: 'fati.ouattara@gmail.com', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Adjamé', repere_logement: 'À côté de la mosquée', adresse: 'Adjamé 220 logements', prix_transport: 350, type_document: 'CNI', numero_document: 'CI2019001234', nni: null, date_validite_document: '2024-11-05', cmu: '4567890123', aej_numero: 'AEJ2024004', niveau_etude: 'BAC', diplome: 'BAC A2', annee_diplome: '2019', metier_choisi: 'Commerce', activite_actuelle: 'Vendeuse', revenu_mensuel: 80000, plus_grande_somme_gere: 500000, situation_matrimoniale: 'Mariée', a_des_enfants: 'Oui', nombre_enfants: 2, nombre_enfants_charge: 2, enfants_au_centre: 'Oui', pere_vivant: 'Oui', pere_nom: 'OUATTARA Seydou', pere_profession: 'Commerçant', pere_contact1: '+225 07 11 22 33 44', pere_contact2: null, mere_vivante: 'Oui', mere_nom: 'OUATTARA née COULIBALY Aïcha', mere_profession: 'Commerçante', mere_contact1: '+225 07 55 44 33 22', mere_contact2: null, urgence_nom: 'OUATTARA Seydou', urgence_affiliation: 'Père', urgence_profession: 'Commerçant', urgence_contact1: '+225 07 11 22 33 44', urgence_contact2: null, statut: 'Validée' },

    { nom: 'COULIBALY', prenom: 'Kadiatou', surnom: 'Kadi', date_naissance: '2003-04-18', lieu_naissance: 'Abidjan', sexe: 'F', telephone: '+225 07 89 01 23 45', telephone_2: null, email: 'kadi.coulibaly@hotmail.fr', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Marcory', repere_logement: 'Près du commissariat', adresse: 'Marcory Zone 4', prix_transport: 450, type_document: 'CNI', numero_document: 'CI2023001567', nni: null, date_validite_document: '2028-04-18', cmu: '5678901234', aej_numero: 'AEJ2024005', niveau_etude: 'Lycée', diplome: 'Terminale A', annee_diplome: '2022', metier_choisi: 'Informatique', activite_actuelle: 'Étudiante', revenu_mensuel: 0, plus_grande_somme_gere: 50000, situation_matrimoniale: 'Célibataire', a_des_enfants: 'Non', nombre_enfants: 0, nombre_enfants_charge: 0, enfants_au_centre: 'Non', pere_vivant: 'Oui', pere_nom: 'COULIBALY Bakary', pere_profession: 'Enseignant', pere_contact1: '+225 07 33 44 55 66', pere_contact2: '+225 05 77 88 99 00', mere_vivante: 'Oui', mere_nom: 'COULIBALY née TOURÉ Mariama', mere_profession: 'Infirmière', mere_contact1: '+225 07 66 55 44 33', mere_contact2: null, urgence_nom: 'COULIBALY Bakary', urgence_affiliation: 'Père', urgence_profession: 'Enseignant', urgence_contact1: '+225 07 33 44 55 66', urgence_contact2: '+225 05 77 88 99 00', statut: 'En attente' },

    { nom: 'SANOGO', prenom: 'Ramatou', surnom: 'Rama', date_naissance: '2001-09-30', lieu_naissance: 'Daloa', sexe: 'F', telephone: '+225 07 12 34 56 78', telephone_2: '+225 05 98 76 54 32', email: 'rama.sanogo@gmail.com', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Koumassi', repere_logement: 'Face à la station', adresse: 'Koumassi Remblais', prix_transport: 400, type_document: 'CNI', numero_document: 'CI2021001890', nni: null, date_validite_document: '2026-09-30', cmu: '6789012345', aej_numero: 'AEJ2024006', niveau_etude: 'Collège', diplome: 'BEPC', annee_diplome: '2019', metier_choisi: 'Couture', activite_actuelle: 'Apprentie couturière', revenu_mensuel: 40000, plus_grande_somme_gere: 180000, situation_matrimoniale: 'Divorcée', a_des_enfants: 'Oui', nombre_enfants: 1, nombre_enfants_charge: 1, enfants_au_centre: 'Oui', pere_vivant: 'Oui', pere_nom: 'SANOGO Lassina', pere_profession: 'Cultivateur', pere_contact1: '+225 07 44 55 66 77', pere_contact2: null, mere_vivante: 'Oui', mere_nom: 'SANOGO née DIABATÉ Salimata', mere_profession: 'Commerçante', mere_contact1: '+225 07 88 77 66 55', mere_contact2: null, urgence_nom: 'SANOGO née DIABATÉ Salimata', urgence_affiliation: 'Mère', urgence_profession: 'Commerçante', urgence_contact1: '+225 07 88 77 66 55', urgence_contact2: null, statut: 'Validée' },

    { nom: 'DIABATÉ', prenom: 'Salimata', surnom: 'Sali', date_naissance: '2002-12-12', lieu_naissance: 'Man', sexe: 'F', telephone: '+225 07 23 45 67 89', telephone_2: null, email: 'sali.diabate@yahoo.fr', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Treichville', repere_logement: 'Près du marché', adresse: 'Treichville Biafra', prix_transport: 350, type_document: 'CNI', numero_document: 'CI2022002123', nni: null, date_validite_document: '2027-12-12', cmu: '7890123456', aej_numero: 'AEJ2024007', niveau_etude: 'BAC', diplome: 'BAC C', annee_diplome: '2021', metier_choisi: 'Électricité', activite_actuelle: 'Sans emploi', revenu_mensuel: 0, plus_grande_somme_gere: 80000, situation_matrimoniale: 'Célibataire', a_des_enfants: 'Non', nombre_enfants: 0, nombre_enfants_charge: 0, enfants_au_centre: 'Non', pere_vivant: 'Oui', pere_nom: 'DIABATÉ Moussa', pere_profession: 'Électricien', pere_contact1: '+225 07 55 66 77 88', pere_contact2: '+225 05 11 22 33 44', mere_vivante: 'Oui', mere_nom: 'DIABATÉ née FOFANA Djénéba', mere_profession: 'Ménagère', mere_contact1: '+225 07 99 88 77 66', mere_contact2: null, urgence_nom: 'DIABATÉ Moussa', urgence_affiliation: 'Père', urgence_profession: 'Électricien', urgence_contact1: '+225 07 55 66 77 88', urgence_contact2: '+225 05 11 22 33 44', statut: 'En attente' },

    { nom: 'TOURÉ', prenom: 'Assétou', surnom: 'Assa', date_naissance: '2000-06-25', lieu_naissance: 'Gagnoa', sexe: 'F', telephone: '+225 07 34 56 78 90', telephone_2: '+225 05 12 23 34 45', email: 'assa.toure@outlook.com', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Port-Bouët', repere_logement: 'Vers l\'aéroport', adresse: 'Port-Bouët Vridi', prix_transport: 500, type_document: 'CNI', numero_document: 'CI2020002456', nni: null, date_validite_document: '2025-06-25', cmu: '8901234567', aej_numero: 'AEJ2024008', niveau_etude: 'BAC', diplome: 'BAC A1', annee_diplome: '2020', metier_choisi: 'Secrétariat', activite_actuelle: 'Réceptionniste', revenu_mensuel: 100000, plus_grande_somme_gere: 400000, situation_matrimoniale: 'Mariée', a_des_enfants: 'Oui', nombre_enfants: 1, nombre_enfants_charge: 1, enfants_au_centre: 'Non', pere_vivant: 'Oui', pere_nom: 'TOURÉ Youssouf', pere_profession: 'Comptable', pere_contact1: '+225 07 66 77 88 99', pere_contact2: null, mere_vivante: 'Oui', mere_nom: 'TOURÉ née CAMARA Hawa', mere_profession: 'Couturière', mere_contact1: '+225 07 22 33 44 55', mere_contact2: null, urgence_nom: 'TOURÉ Youssouf', urgence_affiliation: 'Père', urgence_profession: 'Comptable', urgence_contact1: '+225 07 66 77 88 99', urgence_contact2: null, statut: 'Validée' },

    { nom: 'CAMARA', prenom: 'Hawa', surnom: 'Hawa', date_naissance: '2003-02-14', lieu_naissance: 'Abengourou', sexe: 'F', telephone: '+225 07 45 67 89 01', telephone_2: null, email: 'hawa.camara@gmail.com', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Cocody', repere_logement: 'Riviera Palmeraie', adresse: 'Cocody Riviera Palmeraie', prix_transport: 600, type_document: 'CNI', numero_document: 'CI2023002789', nni: null, date_validite_document: '2028-02-14', cmu: '9012345678', aej_numero: 'AEJ2024009', niveau_etude: 'Lycée', diplome: '2nde A', annee_diplome: '2021', metier_choisi: 'Coiffure', activite_actuelle: 'Apprentie', revenu_mensuel: 25000, plus_grande_somme_gere: 100000, situation_matrimoniale: 'Célibataire', a_des_enfants: 'Non', nombre_enfants: 0, nombre_enfants_charge: 0, enfants_au_centre: 'Non', pere_vivant: 'Oui', pere_nom: 'CAMARA Sékou', pere_profession: 'Commerçant', pere_contact1: '+225 07 11 22 33 44', pere_contact2: '+225 05 55 66 77 88', mere_vivante: 'Oui', mere_nom: 'CAMARA née BAMBA Fatim', mere_profession: 'Gérante de boutique', mere_contact1: '+225 07 99 88 77 66', mere_contact2: null, urgence_nom: 'CAMARA Sékou', urgence_affiliation: 'Père', urgence_profession: 'Commerçant', urgence_contact1: '+225 07 11 22 33 44', urgence_contact2: '+225 05 55 66 77 88', statut: 'En attente' },

    { nom: 'BAMBA', prenom: 'Fatim', surnom: 'Faty', date_naissance: '2001-08-08', lieu_naissance: 'Divo', sexe: 'F', telephone: '+225 07 56 78 90 12', telephone_2: '+225 05 23 34 45 56', email: 'faty.bamba@hotmail.fr', region: 'Abidjan', region_chef_lieu: 'Abidjan', ville: 'Abidjan', quartier: 'Attécoubé', repere_logement: 'Près de la gare', adresse: 'Attécoubé Santé', prix_transport: 300, type_document: 'CNI', numero_document: 'CI2021003012', nni: null, date_validite_document: '2026-08-08', cmu: '0123456789', aej_numero: 'AEJ2024010', niveau_etude: 'Collège', diplome: '3ème', annee_diplome: '2018', metier_choisi: 'Restauration', activite_actuelle: 'Vendeuse de vivres', revenu_mensuel: 60000, plus_grande_somme_gere: 300000, situation_matrimoniale: 'Célibataire', a_des_enfants: 'Oui', nombre_enfants: 2, nombre_enfants_charge: 2, enfants_au_centre: 'Oui', pere_vivant: 'Non', pere_nom: null, pere_profession: null, pere_contact1: null, pere_contact2: null, mere_vivante: 'Oui', mere_nom: 'BAMBA Aïcha', mere_profession: 'Commerçante', mere_contact1: '+225 07 44 55 66 77', mere_contact2: null, urgence_nom: 'BAMBA Aïcha', urgence_affiliation: 'Mère', urgence_profession: 'Commerçante', urgence_contact1: '+225 07 44 55 66 77', urgence_contact2: null, statut: 'Validée' },

    // Ajouter 40 autres candidates avec des profils variés pour les autres villes...
    // Bouaké, San-Pédro, Korhogo, Yamoussoukro, Daloa, Man, Gagnoa, Abengourou, Divo, Bondoukou, Séguéla, Odienné, Soubré, Grand-Bassam
];

async function seedComplet() {
    const connection = await db.getConnection();
    try {
        console.log('🌱 Démarrage du seeding complet avec toutes les données...\n');

        await connection.beginTransaction();

        // Insérer toutes les candidates avec tous les champs
        console.log('👩 Création des candidates avec TOUS les champs remplis...');
        for (const candidate of candidatesData) {
            await connection.query(`
                INSERT INTO candidates (
                    nom, prenom, surnom, date_naissance, lieu_naissance, sexe, telephone, telephone_2, email,
                    region, region_chef_lieu, ville, quartier, repere_logement, adresse, prix_transport,
                    type_document, numero_document, nni, date_validite_document, cmu, aej_numero,
                    niveau_etude, diplome, annee_diplome, metier_choisi, activite_actuelle, revenu_mensuel,
                    plus_grande_somme_gere, situation_matrimoniale, a_des_enfants, nombre_enfants,
                    nombre_enfants_charge, enfants_au_centre, pere_vivant, pere_nom, pere_profession,
                    pere_contact1, pere_contact2, mere_vivante, mere_nom, mere_profession, mere_contact1,
                    mere_contact2, urgence_nom, urgence_affiliation, urgence_profession, urgence_contact1,
                    urgence_contact2, statut
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                candidate.nom, candidate.prenom, candidate.surnom, candidate.date_naissance, candidate.lieu_naissance,
                candidate.sexe, candidate.telephone, candidate.telephone_2, candidate.email, candidate.region,
                candidate.region_chef_lieu, candidate.ville, candidate.quartier, candidate.repere_logement,
                candidate.adresse, candidate.prix_transport, candidate.type_document, candidate.numero_document,
                candidate.nni, candidate.date_validite_document, candidate.cmu, candidate.aej_numero,
                candidate.niveau_etude, candidate.diplome, candidate.annee_diplome, candidate.metier_choisi,
                candidate.activite_actuelle, candidate.revenu_mensuel, candidate.plus_grande_somme_gere,
                candidate.situation_matrimoniale, candidate.a_des_enfants, candidate.nombre_enfants,
                candidate.nombre_enfants_charge, candidate.enfants_au_centre, candidate.pere_vivant,
                candidate.pere_nom, candidate.pere_profession, candidate.pere_contact1, candidate.pere_contact2,
                candidate.mere_vivante, candidate.mere_nom, candidate.mere_profession, candidate.mere_contact1,
                candidate.mere_contact2, candidate.urgence_nom, candidate.urgence_affiliation,
                candidate.urgence_profession, candidate.urgence_contact1, candidate.urgence_contact2, candidate.statut
            ]);

            console.log(`   ✓ ${candidate.prenom} ${candidate.nom} (${candidate.ville}) - ${candidate.metier_choisi}`);
        }

        await connection.commit();

        console.log(`\n✅ ${candidatesData.length} candidates créées avec TOUS les champs!\n`);
        console.log('🎉 Seeding complet terminé avec succès!');

        process.exit(0);
    } catch (error) {
        await connection.rollback();
        console.error('\n❌ Erreur lors du seeding:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        connection.release();
    }
}

seedComplet();
