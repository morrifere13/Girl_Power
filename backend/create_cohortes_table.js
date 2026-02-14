const db = require('./config/db');

async function createCohortesTable() {
    try {
        console.log('🏗️ Creating Cohortes table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS cohortes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                nom VARCHAR(255) NOT NULL,
                code VARCHAR(50) UNIQUE,
                projet_id INT,
                centre_id INT,
                
                -- Dates de recrutement
                date_debut_recrutement DATE,
                date_fin_recrutement DATE,
                
                -- Dates de formation
                date_entree_centre DATE,
                date_fin_formation DATE,
                
                -- Localisation (héritée du projet)
                region VARCHAR(100),
                departement VARCHAR(100),
                sous_prefecture VARCHAR(100),
                localite VARCHAR(100),
                
                -- Statut
                statut ENUM('EN_COURS', 'TERMINEE') DEFAULT 'EN_COURS',
                
                -- Métadonnées
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE SET NULL,
                FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE SET NULL
            )
        `);

        // Add index on projet_id, centre_id, statut for faster lookups
        // await db.query('CREATE INDEX IF NOT EXISTS idx_cohortes_projet ON cohortes(projet_id)');
        // await db.query('CREATE INDEX IF NOT EXISTS idx_cohortes_centre ON cohortes(centre_id)');
        // await db.query('CREATE INDEX IF NOT EXISTS idx_cohortes_statut ON cohortes(statut)');

        console.log('✅ Cohortes table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
}

createCohortesTable();
