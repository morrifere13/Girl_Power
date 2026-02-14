const db = require('./config/db');

async function createProjectsTable() {
    try {
        console.log('🏗️ Creating Projects tables...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(50) UNIQUE NOT NULL,
                nom VARCHAR(255) NOT NULL,
                date_debut DATE,
                date_fin DATE,
                duree_mois INT,
                description TEXT,
                
                -- JSON Fields for lists
                bailleurs JSON,
                partenaires JSON,
                avantages JSON,
                
                -- JSON Field for structured criteria
                criteres_admission JSON, 
                
                -- JSON Field for locations
                zones_intervention JSON,
                
                statut ENUM('PLANIFIE', 'EN_COURS', 'CLOTURE', 'SUSPENDU') DEFAULT 'PLANIFIE',
                
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS project_centres (
                project_id INT,
                centre_id INT,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (project_id, centre_id),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Projects tables created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
}

createProjectsTable();
