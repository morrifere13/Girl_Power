require('dotenv').config();
const mysql = require('mysql2/promise');

async function createStages() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('🔌 Connecté à:', process.env.DB_NAME);

        // Créer la table stages SANS les FK optionnelles
        console.log('\n📄 Création table stages...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS stages (
              id INT PRIMARY KEY AUTO_INCREMENT,
              code VARCHAR(50) UNIQUE NOT NULL,

              candidate_id INT NOT NULL,
              entreprise_id INT NOT NULL,
              cohorte_id INT COMMENT 'Optionnel: stage lié à une cohorte',
              projet_id INT COMMENT 'Optionnel: stage lié à un projet',

              date_debut DATE NOT NULL,
              date_fin DATE NOT NULL,
              duree_mois INT GENERATED ALWAYS AS (TIMESTAMPDIFF(MONTH, date_debut, date_fin)) STORED,

              type_stage ENUM('Stage pendant formation', 'Stage post-formation', 'Stage insertion') NOT NULL,
              metier_stage VARCHAR(100) NOT NULL COMMENT 'Métier/Poste occupé en stage',

              tuteur_nom VARCHAR(255),
              tuteur_fonction VARCHAR(100),
              tuteur_contact VARCHAR(20),
              tuteur_email VARCHAR(255),

              note_entreprise DECIMAL(3,2) COMMENT 'Note donnée par entreprise sur 5',
              note_tuteur DECIMAL(3,2) COMMENT 'Note donnée par le tuteur sur 5',
              commentaire_entreprise TEXT,
              rapport_stage_url VARCHAR(500),
              competences_acquises JSON COMMENT 'Liste des compétences acquises',

              nombre_jours_absence INT DEFAULT 0,
              taux_presence DECIMAL(5,2) COMMENT 'Pourcentage de présence',

              statut ENUM('Planifié', 'En cours', 'Terminé', 'Abandonné', 'Annulé') DEFAULT 'Planifié',
              motif_abandon TEXT COMMENT 'Si abandonné ou annulé',

              indemnite_mensuelle DECIMAL(10,2),
              frais_transport DECIMAL(10,2),
              autres_avantages TEXT,

              observations TEXT,

              created_by INT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              deleted_at TIMESTAMP NULL,

              FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
              FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE,
              FOREIGN KEY (created_by) REFERENCES users(id),

              INDEX idx_candidate (candidate_id),
              INDEX idx_entreprise (entreprise_id),
              INDEX idx_dates (date_debut, date_fin),
              INDEX idx_statut (statut),
              INDEX idx_type (type_stage),
              INDEX idx_code (code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table stages créée (sans FK optionnelles)');

        // Ajouter les FK optionnelles (ignorer si échoue)
        console.log('\n📄 Ajout des FK optionnelles...');
        try {
            await connection.query(`
                ALTER TABLE stages
                ADD CONSTRAINT fk_stages_cohorte
                FOREIGN KEY (cohorte_id) REFERENCES cohortes(id) ON DELETE SET NULL
            `);
            console.log('✅ FK cohorte ajoutée');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  FK cohorte existe déjà');
            } else {
                console.log('⚠️  FK cohorte non ajoutée:', e.message);
            }
        }

        try {
            await connection.query(`
                ALTER TABLE stages
                ADD CONSTRAINT fk_stages_projet
                FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE SET NULL
            `);
            console.log('✅ FK projet ajoutée');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  FK projet existe déjà');
            } else {
                console.log('⚠️  FK projet non ajoutée:', e.message);
            }
        }

        // Créer table stage_evaluations
        console.log('\n📄 Création table stage_evaluations...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS stage_evaluations (
              id INT PRIMARY KEY AUTO_INCREMENT,
              stage_id INT NOT NULL,

              date_evaluation DATE NOT NULL,
              periode VARCHAR(50) COMMENT 'Début, Mi-parcours, Fin, etc.',

              evaluateur_nom VARCHAR(255),
              evaluateur_type ENUM('Tuteur entreprise', 'Formateur centre', 'Coordinateur projet') NOT NULL,

              note_competences_techniques DECIMAL(3,2),
              note_comportement_professionnel DECIMAL(3,2),
              note_assiduite DECIMAL(3,2),
              note_autonomie DECIMAL(3,2),
              note_integration DECIMAL(3,2),
              note_globale DECIMAL(3,2),

              points_forts TEXT,
              points_amelioration TEXT,
              commentaire_general TEXT,
              recommandations TEXT,

              created_by INT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

              FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
              FOREIGN KEY (created_by) REFERENCES users(id),

              INDEX idx_stage (stage_id),
              INDEX idx_date (date_evaluation),
              INDEX idx_evaluateur_type (evaluateur_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table stage_evaluations créée');

        // Mettre à jour candidates
        console.log('\n📄 Mise à jour table candidates...');

        const alterCommands = [
            'ADD COLUMN en_stage BOOLEAN DEFAULT FALSE COMMENT "Actuellement en stage"',
            'ADD COLUMN nombre_stages_effectues INT DEFAULT 0 COMMENT "Total stages effectués"',
            'ADD COLUMN dernier_stage_id INT COMMENT "Référence au dernier stage"',
            'ADD COLUMN disponible_stage BOOLEAN DEFAULT TRUE COMMENT "Disponible pour nouveau stage"'
        ];

        for (const cmd of alterCommands) {
            try {
                await connection.query(`ALTER TABLE candidates ${cmd}`);
                console.log('✅ Colonne ajoutée');
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log('⚠️  Colonne existe déjà');
                } else {
                    throw e;
                }
            }
        }

        // FK sur dernier_stage_id
        try {
            await connection.query(`
                ALTER TABLE candidates
                ADD CONSTRAINT fk_candidates_dernier_stage
                FOREIGN KEY (dernier_stage_id) REFERENCES stages(id) ON DELETE SET NULL
            `);
            console.log('✅ FK dernier_stage ajoutée');
        } catch (e) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  FK dernier_stage existe déjà');
            } else {
                console.log('⚠️  FK dernier_stage non ajoutée:', e.message);
            }
        }

        // Index
        const indexes = [
            'idx_en_stage ON candidates(en_stage)',
            'idx_disponible_stage ON candidates(disponible_stage)',
            'idx_dernier_stage ON candidates(dernier_stage_id)'
        ];

        for (const idx of indexes) {
            try {
                await connection.query(`CREATE INDEX ${idx}`);
                console.log(`✅ Index créé`);
            } catch (e) {
                if (e.code === 'ER_DUP_KEYNAME') {
                    console.log('⚠️  Index existe déjà');
                }
            }
        }

        console.log('\n✨ MIGRATIONS TERMINÉES AVEC SUCCÈS!\n');

    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error('Code:', error.code);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

createStages();
