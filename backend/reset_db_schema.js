const db = require('./config/db');

async function resetSchema() {
    try {
        console.log('🔄 Starting Database Schema Reset...');

        // 1. Drop tables in correct order (children first)
        const tablesToDrop = ['candidate_fichiers', 'candidate_diplomes', 'enfants', 'candidates'];
        for (const table of tablesToDrop) {
            await db.query(`DROP TABLE IF EXISTS ${table}`);
            console.log(`❌ Dropped table: ${table}`);
        }

        // 2. Create Candidates Table
        console.log('🏗Creating table: candidates...');
        await db.query(`
            CREATE TABLE candidates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                
                -- Identité
                nom VARCHAR(100) NOT NULL,
                prenom VARCHAR(100) NOT NULL,
                surnom VARCHAR(100),
                date_naissance DATE,
                age INT,
                lieu_naissance VARCHAR(255),
                sexe ENUM('F', 'M') DEFAULT 'F',
                
                -- Contact
                telephone VARCHAR(20),
                telephone_2 VARCHAR(20),
                email VARCHAR(255),
                
                -- Localisation
                region VARCHAR(100),
                region_chef_lieu VARCHAR(100),
                ville VARCHAR(100),
                quartier VARCHAR(100),
                repere_logement VARCHAR(500),
                adresse VARCHAR(500),
                prix_transport INT,
                
                -- Documents
                type_document VARCHAR(100),
                numero_document VARCHAR(100),
                nni VARCHAR(50),
                date_validite_document DATE,
                cmu VARCHAR(50),
                aej_numero VARCHAR(50),
                
                -- Formation & Profession
                niveau_etude VARCHAR(255),
                diplome text,
                annee_diplome INT,
                metier_choisi VARCHAR(255),
                activite_actuelle VARCHAR(255),
                revenu_mensuel INT,
                plus_grande_somme_gere INT,
                
                -- Famille
                situation_matrimoniale VARCHAR(50),
                a_des_enfants BOOLEAN DEFAULT FALSE,
                nombre_enfants INT DEFAULT 0,
                nombre_enfants_charge INT DEFAULT 0,
                enfants_au_centre BOOLEAN DEFAULT FALSE,
                
                -- Parents
                pere_vivant BOOLEAN DEFAULT TRUE,
                pere_nom VARCHAR(255),
                pere_profession VARCHAR(255),
                pere_contact1 VARCHAR(20),
                pere_contact2 VARCHAR(20),
                mere_vivante BOOLEAN DEFAULT TRUE,
                mere_nom VARCHAR(255),
                mere_profession VARCHAR(255),
                mere_contact1 VARCHAR(20),
                mere_contact2 VARCHAR(20),
                
                -- Urgence
                urgence_nom VARCHAR(255),
                urgence_affiliation VARCHAR(100),
                urgence_profession VARCHAR(255),
                urgence_contact1 VARCHAR(20),
                urgence_contact2 VARCHAR(20),
                
                -- Système
                statut VARCHAR(50) DEFAULT 'En attente',
                photo VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Create Enfants Table
        console.log('🏗Creating table: enfants...');
        await db.query(`
            CREATE TABLE enfants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_id INT NOT NULL,
                nom VARCHAR(100),
                prenom VARCHAR(100),
                date_naissance DATE,
                age INT,
                sexe ENUM('M', 'F'),
                au_centre BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Create Candidate Diplomes Table (for multi-select if needed)
        console.log('🏗Creating table: candidate_diplomes...');
        await db.query(`
            CREATE TABLE candidate_diplomes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_id INT NOT NULL,
                diplome VARCHAR(255),
                annee_obtention INT,
                etablissement VARCHAR(255),
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Create Candidate Fichiers Table (for attachments)
        console.log('🏗Creating table: candidate_fichiers...');
        await db.query(`
            CREATE TABLE candidate_fichiers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                candidate_id INT NOT NULL,
                nom_fichier VARCHAR(255),
                chemin_fichier VARCHAR(500),
                type_fichier VARCHAR(100),
                taille_fichier INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Database Schema Reset Successfully Completed!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error resetting database schema:', error);
        process.exit(1);
    }
}

resetSchema();
