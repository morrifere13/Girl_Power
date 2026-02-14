/**
 * Script pour créer 5 candidats fictifs avec tous les champs remplis
 * 3 candidats avec des enfants
 */
const db = require('../config/db');

const candidates = [
  {
    // Candidate 1 - Avec 2 enfants
    nom: 'DIALLO',
    prenom: 'Fatoumata',
    surnom: 'Fatou',
    date_naissance: '1995-03-15',
    age: 30,
    lieu_naissance: 'Conakry',
    sexe: 'F',
    telephone: '62123456',
    telephone_2: '66789012',
    email: 'fatoumata.diallo@email.com',
    region: 'Conakry',
    region_chef_lieu: 'Kaloum',
    ville: 'Ratoma',
    quartier: 'Kipé',
    repere_logement: 'Près du marché de Kipé, à côté de la pharmacie',
    adresse: 'Kipé Centre, Rue KA-125',
    prix_transport: 15000,
    type_document: 'CNI',
    numero_document: 'GN2024123456',
    nni: '1995031500123',
    date_validite_document: '2029-03-15',
    cmu: 'CMU-2024-001234',
    aej_numero: 'AEJ-GN-00456',
    diplome: 'BEPC',
    annee_diplome: 2012,
    niveau_etude: 'Secondaire',
    metier_choisi: 'Couture',
    activite_actuelle: 'Vendeuse de tissus',
    revenu_mensuel: 350000,
    plus_grande_somme_gere: 2000000,
    situation_matrimoniale: 'Mariée',
    a_des_enfants: true,
    nombre_enfants: 2,
    nombre_enfants_charge: 2,
    enfants_au_centre: true,
    statut: 'En formation',
    pere_nom: 'DIALLO Mamadou',
    pere_profession: 'Commerçant',
    pere_contact1: '62111111',
    pere_contact2: '66222222',
    pere_vivant: true,
    mere_nom: 'BARRY Mariama',
    mere_profession: 'Ménagère',
    mere_contact1: '62333333',
    mere_contact2: '66444444',
    mere_vivante: true,
    urgence_nom: 'DIALLO Abdoulaye',
    urgence_affiliation: 'Frère',
    urgence_profession: 'Enseignant',
    urgence_contact1: '62555555',
    urgence_contact2: '66666666',
    projet_id: 2,
    cohorte_id: 1,
    centre_id: 1,
    enfants: [
      {
        nom: 'DIALLO',
        prenom: 'Aissatou',
        date_naissance: '2018-06-20',
        age: 6,
        sexe: 'F',
        au_centre: true
      },
      {
        nom: 'DIALLO',
        prenom: 'Mamadou',
        date_naissance: '2020-11-10',
        age: 4,
        sexe: 'M',
        au_centre: true
      }
    ]
  },
  {
    // Candidate 2 - Avec 3 enfants
    nom: 'CAMARA',
    prenom: 'Kadiatou',
    surnom: 'Kadi',
    date_naissance: '1992-08-22',
    age: 33,
    lieu_naissance: 'Kindia',
    sexe: 'F',
    telephone: '62234567',
    telephone_2: '66890123',
    email: 'kadiatou.camara@email.com',
    region: 'Kindia',
    region_chef_lieu: 'Kindia',
    ville: 'Kindia Centre',
    quartier: 'Manquepas',
    repere_logement: 'Derrière la gare routière, maison bleue',
    adresse: 'Manquepas Secteur 3, Villa 45',
    prix_transport: 25000,
    type_document: 'Passeport',
    numero_document: 'PA2023789012',
    nni: '1992082200456',
    date_validite_document: '2028-08-22',
    cmu: 'CMU-2024-002345',
    aej_numero: 'AEJ-GN-00789',
    diplome: 'BAC',
    annee_diplome: 2011,
    niveau_etude: 'Baccalauréat',
    metier_choisi: 'Pâtisserie - Cuisine',
    activite_actuelle: 'Restauratrice',
    revenu_mensuel: 500000,
    plus_grande_somme_gere: 5000000,
    situation_matrimoniale: 'Veuve',
    a_des_enfants: true,
    nombre_enfants: 3,
    nombre_enfants_charge: 3,
    enfants_au_centre: true,
    statut: 'Validée',
    pere_nom: 'CAMARA Ibrahima',
    pere_profession: 'Agriculteur',
    pere_contact1: '62777777',
    pere_contact2: '66888888',
    pere_vivant: false,
    mere_nom: 'SOUMAH Fanta',
    mere_profession: 'Commerçante',
    mere_contact1: '62999999',
    mere_contact2: '66000000',
    mere_vivante: true,
    urgence_nom: 'CAMARA Sekou',
    urgence_affiliation: 'Cousin',
    urgence_profession: 'Chauffeur',
    urgence_contact1: '62111222',
    urgence_contact2: '66333444',
    projet_id: 2,
    cohorte_id: 1,
    centre_id: 1,
    enfants: [
      {
        nom: 'CAMARA',
        prenom: 'Fode',
        date_naissance: '2014-02-14',
        age: 11,
        sexe: 'M',
        au_centre: false
      },
      {
        nom: 'CAMARA',
        prenom: 'Aminata',
        date_naissance: '2017-09-05',
        age: 7,
        sexe: 'F',
        au_centre: true
      },
      {
        nom: 'CAMARA',
        prenom: 'Mohamed',
        date_naissance: '2021-01-30',
        age: 4,
        sexe: 'M',
        au_centre: true
      }
    ]
  },
  {
    // Candidate 3 - Avec 1 enfant
    nom: 'BAH',
    prenom: 'Mariama',
    surnom: 'Mimi',
    date_naissance: '1998-12-03',
    age: 27,
    lieu_naissance: 'Labé',
    sexe: 'F',
    telephone: '62345678',
    telephone_2: '66901234',
    email: 'mariama.bah@email.com',
    region: 'Labé',
    region_chef_lieu: 'Labé',
    ville: 'Labé Centre',
    quartier: 'Tata',
    repere_logement: 'À côté de la mosquée centrale',
    adresse: 'Quartier Tata, Rue 12',
    prix_transport: 35000,
    type_document: 'CNI',
    numero_document: 'GN2022567890',
    nni: '1998120300789',
    date_validite_document: '2027-12-03',
    cmu: 'CMU-2024-003456',
    aej_numero: 'AEJ-GN-01234',
    diplome: 'CAP',
    annee_diplome: 2016,
    niveau_etude: 'Professionnel',
    metier_choisi: 'Coiffure - Esthétique',
    activite_actuelle: 'Coiffeuse à domicile',
    revenu_mensuel: 250000,
    plus_grande_somme_gere: 1500000,
    situation_matrimoniale: 'Divorcée',
    a_des_enfants: true,
    nombre_enfants: 1,
    nombre_enfants_charge: 1,
    enfants_au_centre: false,
    statut: 'En formation',
    pere_nom: 'BAH Thierno',
    pere_profession: 'Éleveur',
    pere_contact1: '62555666',
    pere_contact2: '66777888',
    pere_vivant: true,
    mere_nom: 'DIALLO Hawa',
    mere_profession: 'Tisseuse',
    mere_contact1: '62999000',
    mere_contact2: '66111222',
    mere_vivante: true,
    urgence_nom: 'BAH Oumar',
    urgence_affiliation: 'Oncle',
    urgence_profession: 'Imam',
    urgence_contact1: '62333444',
    urgence_contact2: '66555666',
    projet_id: 2,
    cohorte_id: 2,
    centre_id: 1,
    enfants: [
      {
        nom: 'BAH',
        prenom: 'Boubacar',
        date_naissance: '2019-07-18',
        age: 5,
        sexe: 'M',
        au_centre: false
      }
    ]
  },
  {
    // Candidate 4 - Sans enfant
    nom: 'SYLLA',
    prenom: 'Djénabou',
    surnom: 'Djéna',
    date_naissance: '2000-05-10',
    age: 25,
    lieu_naissance: 'Kankan',
    sexe: 'F',
    telephone: '62456789',
    telephone_2: '66012345',
    email: 'djenabou.sylla@email.com',
    region: 'Kankan',
    region_chef_lieu: 'Kankan',
    ville: 'Kankan Centre',
    quartier: 'Kabada',
    repere_logement: 'En face du stade municipal',
    adresse: 'Kabada Nord, Parcelle 78',
    prix_transport: 45000,
    type_document: 'CNI',
    numero_document: 'GN2023345678',
    nni: '2000051000321',
    date_validite_document: '2028-05-10',
    cmu: 'CMU-2024-004567',
    aej_numero: 'AEJ-GN-02345',
    diplome: 'BTS',
    annee_diplome: 2021,
    niveau_etude: 'Supérieur',
    metier_choisi: 'Informatique',
    activite_actuelle: 'Étudiante',
    revenu_mensuel: 0,
    plus_grande_somme_gere: 500000,
    situation_matrimoniale: 'Célibataire',
    a_des_enfants: false,
    nombre_enfants: 0,
    nombre_enfants_charge: 0,
    enfants_au_centre: false,
    statut: 'En attente',
    pere_nom: 'SYLLA Lancei',
    pere_profession: 'Fonctionnaire',
    pere_contact1: '62777888',
    pere_contact2: '66999000',
    pere_vivant: true,
    mere_nom: 'KEITA Nana',
    mere_profession: 'Sage-femme',
    mere_contact1: '62111333',
    mere_contact2: '66444555',
    mere_vivante: true,
    urgence_nom: 'SYLLA Mory',
    urgence_affiliation: 'Père',
    urgence_profession: 'Fonctionnaire',
    urgence_contact1: '62777888',
    urgence_contact2: '66999000',
    projet_id: 2,
    cohorte_id: 3,
    centre_id: 2,
    enfants: []
  },
  {
    // Candidate 5 - Sans enfant
    nom: 'CONDE',
    prenom: 'Safiatou',
    surnom: 'Safia',
    date_naissance: '1997-01-25',
    age: 29,
    lieu_naissance: 'N\'Zérékoré',
    sexe: 'F',
    telephone: '62567890',
    telephone_2: '66123456',
    email: 'safiatou.conde@email.com',
    region: 'N\'Zérékoré',
    region_chef_lieu: 'N\'Zérékoré',
    ville: 'N\'Zérékoré Centre',
    quartier: 'Gonia',
    repere_logement: 'Près de l\'hôpital régional, 2ème carrefour',
    adresse: 'Gonia 2, Villa 156',
    prix_transport: 55000,
    type_document: 'Extrait de naissance',
    numero_document: 'EXT2020123456',
    nni: '1997012500654',
    date_validite_document: '2030-01-25',
    cmu: 'CMU-2024-005678',
    aej_numero: 'AEJ-GN-03456',
    diplome: 'Licence',
    annee_diplome: 2019,
    niveau_etude: 'Licence',
    metier_choisi: 'Agro-pastorale',
    activite_actuelle: 'Agricultrice',
    revenu_mensuel: 400000,
    plus_grande_somme_gere: 3000000,
    situation_matrimoniale: 'En couple',
    a_des_enfants: false,
    nombre_enfants: 0,
    nombre_enfants_charge: 0,
    enfants_au_centre: false,
    statut: 'Validée',
    pere_nom: 'CONDE Mamady',
    pere_profession: 'Planteur',
    pere_contact1: '62888999',
    pere_contact2: '66000111',
    pere_vivant: true,
    mere_nom: 'TOLNO Marie',
    mere_profession: 'Commerçante',
    mere_contact1: '62222333',
    mere_contact2: '66555777',
    mere_vivante: true,
    urgence_nom: 'CONDE Aboubacar',
    urgence_affiliation: 'Frère aîné',
    urgence_profession: 'Médecin',
    urgence_contact1: '62444666',
    urgence_contact2: '66888000',
    projet_id: 2,
    cohorte_id: 4,
    centre_id: 2,
    enfants: []
  }
];

async function seedCandidates() {
  console.log('🌱 Début de l\'insertion des candidats fictifs...\n');

  try {
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      console.log(`📝 Insertion de ${c.prenom} ${c.nom}...`);

      // Insérer le candidat
      const [result] = await db.query(`
        INSERT INTO candidates (
          nom, prenom, surnom, date_naissance, age, lieu_naissance, sexe,
          telephone, telephone_2, email,
          region, region_chef_lieu, ville, quartier, repere_logement, adresse, prix_transport,
          type_document, numero_document, nni, date_validite_document, cmu, aej_numero,
          diplome, annee_diplome, niveau_etude, metier_choisi, activite_actuelle,
          revenu_mensuel, plus_grande_somme_gere,
          situation_matrimoniale, a_des_enfants, nombre_enfants, nombre_enfants_charge, enfants_au_centre,
          statut,
          pere_nom, pere_profession, pere_contact1, pere_contact2, pere_vivant,
          mere_nom, mere_profession, mere_contact1, mere_contact2, mere_vivante,
          urgence_nom, urgence_affiliation, urgence_profession, urgence_contact1, urgence_contact2,
          projet_id, cohorte_id, centre_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        c.nom, c.prenom, c.surnom, c.date_naissance, c.age, c.lieu_naissance, c.sexe,
        c.telephone, c.telephone_2, c.email,
        c.region, c.region_chef_lieu, c.ville, c.quartier, c.repere_logement, c.adresse, c.prix_transport,
        c.type_document, c.numero_document, c.nni, c.date_validite_document, c.cmu, c.aej_numero,
        c.diplome, c.annee_diplome, c.niveau_etude, c.metier_choisi, c.activite_actuelle,
        c.revenu_mensuel, c.plus_grande_somme_gere,
        c.situation_matrimoniale, c.a_des_enfants, c.nombre_enfants, c.nombre_enfants_charge, c.enfants_au_centre,
        c.statut,
        c.pere_nom, c.pere_profession, c.pere_contact1, c.pere_contact2, c.pere_vivant,
        c.mere_nom, c.mere_profession, c.mere_contact1, c.mere_contact2, c.mere_vivante,
        c.urgence_nom, c.urgence_affiliation, c.urgence_profession, c.urgence_contact1, c.urgence_contact2,
        c.projet_id, c.cohorte_id, c.centre_id
      ]);

      const candidateId = result.insertId;
      console.log(`   ✅ Candidat créé avec ID: ${candidateId}`);

      // Insérer les enfants si présents
      if (c.enfants && c.enfants.length > 0) {
        for (const enfant of c.enfants) {
          await db.query(`
            INSERT INTO enfants (candidate_id, nom, prenom, date_naissance, age, sexe, au_centre)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [candidateId, enfant.nom, enfant.prenom, enfant.date_naissance, enfant.age, enfant.sexe, enfant.au_centre]);
        }
        console.log(`   👶 ${c.enfants.length} enfant(s) ajouté(s)`);
      }

      console.log('');
    }

    console.log('✨ Tous les candidats ont été insérés avec succès!');
    console.log('\n📊 Résumé:');
    console.log('   - 5 candidats créés');
    console.log('   - 3 avec enfants (total: 6 enfants)');
    console.log('   - 2 sans enfants');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error.message);
  } finally {
    process.exit(0);
  }
}

seedCandidates();
