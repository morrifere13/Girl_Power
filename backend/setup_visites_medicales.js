const db = require('./config/db');

async function setupVisitesMedicales() {
    try {
        console.log('🏥 Configuration de la table visites_medicales...\n');

        // 1. Créer la table si elle n'existe pas
        console.log('📋 Création de la table visites_medicales...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS visites_medicales (
                id INT PRIMARY KEY AUTO_INCREMENT,
                candidate_id INT NOT NULL,
                date_visite DATE NOT NULL,
                ville_visite VARCHAR(100),
                medecin_nom VARCHAR(255) NOT NULL,
                etablissement VARCHAR(255),

                -- Mesures physiques
                taille DECIMAL(5,2) COMMENT 'Taille en cm',
                poids DECIMAL(5,2) COMMENT 'Poids en kg',
                imc DECIMAL(5,2) COMMENT 'IMC calculé',
                interpretation_imc VARCHAR(50) COMMENT 'Maigreur/Normal/Surpoids/Obésité',
                temperature DECIMAL(4,2) COMMENT 'Température en °C',

                -- Mesures complémentaires
                tension_arterielle VARCHAR(20) COMMENT 'Ex: 120/80',
                pouls VARCHAR(20) COMMENT 'Pouls en bpm',
                pignet DECIMAL(5,2) COMMENT 'Indice de Pignet',

                -- Examens sensoriels
                av VARCHAR(50) COMMENT 'Acuité visuelle',
                vision TEXT COMMENT 'Examen vision détaillé',
                audition TEXT COMMENT 'Examen audition',

                -- Examens physiques
                buccodentaire TEXT COMMENT 'Examen buccodentaire',
                bdc TEXT COMMENT 'Bruits du cœur',
                peau TEXT COMMENT 'Examen de la peau',

                -- Examens par systèmes
                coeur_poumons TEXT COMMENT 'Examen cœur et poumons',
                abdomen TEXT COMMENT 'Examen abdominal',
                membres_superieurs TEXT COMMENT 'Examen membres supérieurs',
                membres_inferieurs TEXT COMMENT 'Examen membres inférieurs',

                -- État général
                etat_general VARCHAR(50) COMMENT 'Bon/Moyen/Mauvais',
                asthmatique BOOLEAN DEFAULT FALSE,
                handicap BOOLEAN DEFAULT FALSE,

                -- Spécifique femmes
                test_grossesse ENUM('NEGATIF', 'POSITIF', 'NON_APPLICABLE') DEFAULT 'NON_APPLICABLE',
                grossesse BOOLEAN DEFAULT FALSE,

                -- Informations complémentaires
                groupe_sanguin VARCHAR(10) COMMENT 'A+, A-, B+, B-, O+, O-, AB+, AB-',
                allergies TEXT,
                maladies_chroniques TEXT,

                -- Résultats (JSON)
                examens JSON COMMENT 'Liste des examens réalisés',
                contre_indications JSON COMMENT 'Liste des contre-indications',

                -- Aptitude et observations
                apte_physiquement BOOLEAN DEFAULT TRUE,
                observations TEXT,

                -- Statut final
                statut ENUM('VALIDE', 'REJETE', 'EN_ATTENTE') DEFAULT 'EN_ATTENTE',

                -- Audit
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,

                INDEX idx_candidate (candidate_id),
                INDEX idx_statut (statut),
                INDEX idx_date (date_visite)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Table visites_medicales créée/vérifiée');

        // 2. Ajouter les colonnes manquantes (si la table existait déjà)
        const columnsToAdd = [
            { name: 'ville_visite', type: 'VARCHAR(100)' },
            { name: 'taille', type: 'DECIMAL(5,2)' },
            { name: 'poids', type: 'DECIMAL(5,2)' },
            { name: 'imc', type: 'DECIMAL(5,2)' },
            { name: 'interpretation_imc', type: 'VARCHAR(50)' },
            { name: 'temperature', type: 'DECIMAL(4,2)' },
            { name: 'tension_arterielle', type: 'VARCHAR(20)' },
            { name: 'pouls', type: 'VARCHAR(20)' },
            { name: 'pignet', type: 'DECIMAL(5,2)' },
            { name: 'av', type: 'VARCHAR(50)' },
            { name: 'vision', type: 'TEXT' },
            { name: 'audition', type: 'TEXT' },
            { name: 'buccodentaire', type: 'TEXT' },
            { name: 'bdc', type: 'TEXT' },
            { name: 'peau', type: 'TEXT' },
            { name: 'coeur_poumons', type: 'TEXT' },
            { name: 'abdomen', type: 'TEXT' },
            { name: 'membres_superieurs', type: 'TEXT' },
            { name: 'membres_inferieurs', type: 'TEXT' },
            { name: 'etat_general', type: 'VARCHAR(50)' },
            { name: 'asthmatique', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'handicap', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'grossesse', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'groupe_sanguin', type: 'VARCHAR(10)' },
            { name: 'allergies', type: 'TEXT' },
            { name: 'maladies_chroniques', type: 'TEXT' }
        ];

        console.log('\n📋 Vérification des colonnes...');
        for (const col of columnsToAdd) {
            try {
                await db.query(`ALTER TABLE visites_medicales ADD COLUMN ${col.name} ${col.type}`);
                console.log(`  ✅ ${col.name} ajoutée`);
            } catch (e) {
                if (e.message.includes('Duplicate column')) {
                    // Column exists, skip
                } else {
                    console.log(`  ⚠️ ${col.name}: ${e.message}`);
                }
            }
        }

        // 3. Vérifier la colonne projet_id dans cohortes
        console.log('\n📋 Vérification de la structure des tables liées...');
        try {
            const [cohorteCols] = await db.query('SHOW COLUMNS FROM cohortes LIKE "project_id"');
            if (cohorteCols.length === 0) {
                // Vérifier si c'est projet_id au lieu de project_id
                const [projetCols] = await db.query('SHOW COLUMNS FROM cohortes LIKE "projet_id"');
                if (projetCols.length > 0) {
                    console.log('  ℹ️ La table cohortes utilise "projet_id" au lieu de "project_id"');
                }
            } else {
                console.log('  ✅ Structure cohortes OK');
            }
        } catch (e) {
            console.log('  ⚠️ Impossible de vérifier la table cohortes');
        }

        console.log('\n🎉 Configuration terminée avec succès!');
        console.log('\n📋 La table visites_medicales est prête avec tous les champs:');
        console.log('   - Mesures: taille, poids, IMC, température, TA, pouls, pignet');
        console.log('   - Examens: vision, audition, buccodentaire, BDC, peau');
        console.log('   - Systèmes: cœur_poumons, abdomen, membres');
        console.log('   - État: général, asthmatique, handicap, grossesse');
        console.log('   - Infos: groupe sanguin, allergies, maladies chroniques');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error);
        process.exit(1);
    }
}

setupVisitesMedicales();
