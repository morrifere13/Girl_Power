const db = require('./config/db');

// Helper pour générer des données aléatoires mais réalistes
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
};

// Données de base
const prenoms = ['Aya', 'Aminata', 'Fatoumata', 'Mariam', 'Kadiatou', 'Ramatou', 'Salimata', 'Assétou', 'Hawa', 'Fatim', 'Awa', 'Mariama', 'Djénéba', 'Bineta', 'Aïssata', 'Rokia', 'Adama', 'Safiatou', 'Tenin', 'Korotoumou', 'Maimouna', 'Oumou', 'Sitan', 'Bintou', 'Aicha', 'Nana', 'Fanta', 'Astan', 'Massara', 'Zeinab'];
const noms = ['KONÉ', 'DIALLO', 'TRAORÉ', 'OUATTARA', 'COULIBALY', 'SANOGO', 'DIABATÉ', 'TOURÉ', 'CAMARA', 'BAMBA', 'KONATÉ', 'DOUMBIA', 'FOFANA', 'CISSÉ', 'KABA', 'SAVANÉ', 'DEMBÉLÉ', 'KEITA', 'SYLLA', 'CONDÉ'];
const surnoms = ['Yaya', 'Mina', 'Mimi', 'Fati', 'Kadi', 'Rama', 'Sali', 'Assa', 'Hawa', 'Faty', 'Aïcha', 'Nana', 'Bintou', 'Rokia', 'Tenin'];
const quartiers = {
    'Abidjan': ['Cocody', 'Yopougon', 'Abobo', 'Adjamé', 'Marcory', 'Koumassi', 'Treichville', 'Port-Bouët', 'Attécoubé', 'Plateau'],
    'Bouaké': ['Commerce', 'Koko', 'Air France', 'Nimbo', 'Dar Es Salam', 'Belleville', 'Bromakoté'],
    'San-Pédro': ['Zone Industrielle', 'Bardot', 'Balmer', 'Sépingo', 'Bardo'],
    'Korhogo': ['Centre-ville', 'Air France', 'Petit Paris', 'Soba', 'Sinistré'],
    'Yamoussoukro': ['Habitat', 'Moronou', 'N\'Zuessy', 'Dioulakro', 'Kokrenou'],
    'Daloa': ['Tazibouo', 'Lobia', 'Commerce', 'Orly', 'Kennedy'],
    'Man': ['Centre-ville', 'Libreville', 'Dompleu', 'Dougoupleu', 'Sangouiné'],
    'Gagnoa': ['Gnagbodougnoa', 'Dioulabougou', 'Belleville', 'Commerce'],
    'Abengourou': ['Centre', 'Résidentiel', 'Ehania', 'Sankadiokro'],
    'Divo': ['Centre Commercial', 'Hiré', 'Bléssékoukro'],
    'Bondoukou': ['Sorobango', 'Kamagaya', 'Bougoudougou', 'Centre'],
    'Séguéla': ['Administratif', 'Commerce', 'Centre'],
    'Odienné': ['Centre-ville', 'Commerce', 'Résidentiel'],
    'Soubré': ['Grand Marché', 'Belleville', 'Centre'],
    'Grand-Bassam': ['Zone Touristique', 'Impérial', 'Phare', 'Ancien Bassam']
};

const niveaux_etude = ['Primaire', 'Collège', 'Lycée', 'BAC', 'BAC+1', 'BAC+2'];
const diplomes = {
    'Primaire': ['CEP', 'CM2'],
    'Collège': ['BEPC', '3ème'],
    'Lycée': ['1ère A', '1ère D', '2nde A', '2nde C', 'Terminale'],
    'BAC': ['BAC A1', 'BAC A2', 'BAC C', 'BAC D', 'BAC G'],
    'BAC+1': ['BT', 'CAP'],
    'BAC+2': ['BTS', 'DUT']
};

const metiers = ['Couture', 'Coiffure', 'Pâtisserie', 'Commerce', 'Informatique', 'Électricité', 'Plomberie', 'Mécanique', 'Menuiserie', 'Sérigraphie', 'Hôtellerie', 'Secrétariat', 'Agriculture', 'Restauration', 'Artisanat'];
const activites = ['Sans emploi', 'Petits travaux', 'Apprentie', 'Vendeuse', 'Aide familiale', 'Étudiante', 'Stagiaire'];
const situations = ['Célibataire', 'Mariée', 'Divorcée', 'Veuve'];
const professions = ['Commerçant', 'Cultivateur', 'Chauffeur', 'Enseignant', 'Infirmière', 'Mécanicien', 'Électricien', 'Comptable', 'Couturière', 'Ménagère', 'Gérante', 'Fonctionnaire'];

// Fonction pour calculer l'âge
const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

// Générer une candidate complète
const generateCandidate = (ville, region, centreId, projetId, cohorteId, index) => {
    const prenom = random(prenoms);
    const nom = random(noms);
    const date_naissance = randomDate(new Date(1998, 0, 1), new Date(2006, 11, 31));
    const age = calculateAge(date_naissance);
    const niveau = random(niveaux_etude);
    const situation = random(situations);
    const hasChildren = situation !== 'Célibataire' ? random(['Oui', 'Non']) : 'Non';
    const nombreEnfants = hasChildren === 'Oui' ? randomInt(1, 4) : 0;
    const quartier = random(quartiers[ville] || ['Centre']);
    const tel1 = `+225 07 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`;
    const tel2 = Math.random() > 0.5 ? `+225 05 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}` : null;

    const pereVivant = random(['Oui', 'Non']);
    const mereVivante = random(['Oui', 'Oui', 'Oui', 'Non']); // Plus de chances que la mère soit vivante
    const nomPere = pereVivant === 'Oui' ? `${nom} ${random(['Moussa', 'Ibrahim', 'Seydou', 'Bakary', 'Mamadou', 'Youssouf'])}` : null;
    const nomMere = mereVivante === 'Oui' ? `${nom} née ${random(noms)} ${random(prenoms)}` : null;

    return {
        // Informations personnelles
        nom: nom,
        prenom: prenom,
        surnom: random(surnoms),
        date_naissance: date_naissance,
        age: age,
        lieu_naissance: random([ville, 'Abidjan', 'Bouaké', 'Yamoussoukro']),
        sexe: 'F',

        // Contact
        telephone: tel1,
        telephone_2: tel2,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}${index}@email.ci`,

        // Adresse
        region: region,
        region_chef_lieu: region,
        ville: ville,
        quartier: quartier,
        repere_logement: random(['Près du marché', 'Face à la pharmacie', 'Derrière l\'école', 'À côté de la mosquée', 'Vers la gare', 'Près du commissariat', 'Face à la station']),
        adresse: `${quartier}, ${random(['Rue', 'Avenue', 'Boulevard'])} ${randomInt(1, 50)}`,
        prix_transport: randomInt(200, 800),

        // Documents
        type_document: 'CNI',
        numero_document: `CI${2020 + randomInt(0, 4)}${String(randomInt(1, 999999)).padStart(6, '0')}`,
        nni: null,
        date_validite_document: randomDate(new Date(2025, 0, 1), new Date(2030, 11, 31)),
        cmu: String(randomInt(1000000000, 9999999999)),
        aej_numero: `AEJ2024${String(index).padStart(4, '0')}`,

        // Éducation
        niveau_etude: niveau,
        diplome: random(diplomes[niveau] || ['Aucun']),
        annee_diplome: String(2016 + randomInt(0, 8)),

        // Professionnel
        metier_choisi: random(metiers),
        activite_actuelle: random(activites),
        revenu_mensuel: randomInt(0, 150) * 1000,
        plus_grande_somme_gere: randomInt(50, 600) * 1000,

        // Situation familiale
        situation_matrimoniale: situation,
        a_des_enfants: hasChildren,
        nombre_enfants: nombreEnfants,
        nombre_enfants_charge: hasChildren === 'Oui' ? randomInt(0, nombreEnfants) : 0,
        enfants_au_centre: hasChildren === 'Oui' && nombreEnfants > 0 ? random(['Oui', 'Non']) : 'Non',

        // Parents
        pere_vivant: pereVivant,
        pere_nom: nomPere,
        pere_profession: pereVivant === 'Oui' ? random(professions) : null,
        pere_contact1: pereVivant === 'Oui' ? `+225 07 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}` : null,
        pere_contact2: pereVivant === 'Oui' && Math.random() > 0.7 ? `+225 05 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}` : null,

        mere_vivante: mereVivante,
        mere_nom: nomMere,
        mere_profession: mereVivante === 'Oui' ? random(professions) : null,
        mere_contact1: mereVivante === 'Oui' ? `+225 07 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}` : null,
        mere_contact2: mereVivante === 'Oui' && Math.random() > 0.7 ? `+225 05 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}` : null,

        // Contact d'urgence (priorité: père > mère > autre)
        urgence_nom: nomPere || nomMere || `${random(noms)} ${random(prenoms)}`,
        urgence_affiliation: nomPere ? 'Père' : (nomMere ? 'Mère' : random(['Frère', 'Sœur', 'Oncle', 'Tante', 'Tuteur'])),
        urgence_profession: random(professions),
        urgence_contact1: `+225 07 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
        urgence_contact2: Math.random() > 0.6 ? `+225 05 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}` : null,

        // Statut et relations
        statut: random(['En attente', 'En attente', 'En attente', 'Validée', 'En cours']),

        // Relations uniques
        centre_id: centreId,
        projet_id: projetId,
        cohorte_id: cohorteId
    };
};

async function seedCompleteWithRelations() {
    const connection = await db.getConnection();
    try {
        console.log('🌱 Démarrage du seeding COMPLET avec toutes les relations...\n');

        await connection.beginTransaction();

        // 1. Récupérer les centres existants
        const [centres] = await connection.query('SELECT id, nom, ville, region FROM centres WHERE deleted_at IS NULL ORDER BY id');
        console.log(`📍 ${centres.length} centres trouvés`);

        // 2. Récupérer les projets existants
        const [projets] = await connection.query('SELECT id, nom FROM projects WHERE deleted_at IS NULL ORDER BY id');
        console.log(`📋 ${projets.length} projets trouvés`);

        // 3. Récupérer les cohortes existantes
        const [cohortes] = await connection.query('SELECT id, nom, projet_id FROM cohortes WHERE deleted_at IS NULL ORDER BY id');
        console.log(`👥 ${cohortes.length} cohortes trouvées\n`);

        if (centres.length === 0 || projets.length === 0 || cohortes.length === 0) {
            throw new Error('Vous devez d\'abord exécuter seed_direct.js pour créer les centres, projets et cohortes!');
        }

        // 4. Créer 100 candidates avec relations
        console.log('👩 Création de 100 candidates COMPLÈTES avec relations...\n');

        let candidateCount = 0;
        for (let i = 0; i < 100; i++) {
            // Attribuer aléatoirement un centre, projet et cohorte
            const centre = centres[i % centres.length];
            const projet = projets[i % projets.length];
            const cohorte = cohortes[i % cohortes.length];

            const candidate = generateCandidate(centre.ville, centre.region, centre.id, projet.id, cohorte.id, i + 1);

            // Insérer la candidate avec TOUTES les relations
            await connection.query(`
                INSERT INTO candidates (
                    nom, prenom, surnom, date_naissance, age, lieu_naissance, sexe, telephone, telephone_2, email,
                    region, region_chef_lieu, ville, quartier, repere_logement, adresse, prix_transport,
                    type_document, numero_document, nni, date_validite_document, cmu, aej_numero,
                    niveau_etude, diplome, annee_diplome, metier_choisi, activite_actuelle, revenu_mensuel,
                    plus_grande_somme_gere, situation_matrimoniale, a_des_enfants, nombre_enfants,
                    nombre_enfants_charge, enfants_au_centre, pere_vivant, pere_nom, pere_profession,
                    pere_contact1, pere_contact2, mere_vivante, mere_nom, mere_profession, mere_contact1,
                    mere_contact2, urgence_nom, urgence_affiliation, urgence_profession, urgence_contact1,
                    urgence_contact2, statut
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                candidate.nom, candidate.prenom, candidate.surnom, candidate.date_naissance, candidate.age,
                candidate.lieu_naissance, candidate.sexe, candidate.telephone, candidate.telephone_2,
                candidate.email, candidate.region, candidate.region_chef_lieu, candidate.ville, candidate.quartier,
                candidate.repere_logement, candidate.adresse, candidate.prix_transport, candidate.type_document,
                candidate.numero_document, candidate.nni, candidate.date_validite_document, candidate.cmu,
                candidate.aej_numero, candidate.niveau_etude, candidate.diplome, candidate.annee_diplome,
                candidate.metier_choisi, candidate.activite_actuelle, candidate.revenu_mensuel,
                candidate.plus_grande_somme_gere, candidate.situation_matrimoniale, candidate.a_des_enfants,
                candidate.nombre_enfants, candidate.nombre_enfants_charge, candidate.enfants_au_centre,
                candidate.pere_vivant, candidate.pere_nom, candidate.pere_profession, candidate.pere_contact1,
                candidate.pere_contact2, candidate.mere_vivante, candidate.mere_nom, candidate.mere_profession,
                candidate.mere_contact1, candidate.mere_contact2, candidate.urgence_nom, candidate.urgence_affiliation,
                candidate.urgence_profession, candidate.urgence_contact1, candidate.urgence_contact2, candidate.statut
            ]);

            candidateCount++;
            if (candidateCount % 10 === 0) {
                console.log(`   ✓ ${candidateCount}/100 candidates créées...`);
            }
        }

        await connection.commit();

        console.log(`\n✅ ${candidateCount} candidates créées avec SUCCÈS!`);
        console.log('\n📊 Récapitulatif:');
        console.log(`   - ${centres.length} centres`);
        console.log(`   - ${projets.length} projets`);
        console.log(`   - ${cohortes.length} cohortes`);
        console.log(`   - ${candidateCount} candidates (avec toutes relations)`);
        console.log('\n🎉 Seeding complet terminé!');
        console.log('\n💡 Chaque candidate est liée à:');
        console.log('   - 1 centre unique');
        console.log('   - 1 projet unique');
        console.log('   - 1 cohorte unique');

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

seedCompleteWithRelations();
