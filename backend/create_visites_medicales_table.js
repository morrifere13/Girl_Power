const db = require('./config/db');

async function createVisitesMedicalesTable() {
    try {
        console.log('🏗️ Creating visites_medicales table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS visites_medicales (
                id INT PRIMARY KEY AUTO_INCREMENT,
                candidate_id INT NOT NULL,
                date_visite DATE NOT NULL,
                medecin_nom VARCHAR(255) NOT NULL,
                etablissement VARCHAR(255),
                
                -- Examens réalisés (JSON)
                examens JSON,
                
                -- Résultats généraux
                apte_physiquement BOOLEAN DEFAULT TRUE,
                test_grossesse ENUM('NEGATIF', 'POSITIF', 'NON_APPLICABLE') DEFAULT 'NON_APPLICABLE',
                
                -- Contre-indications (JSON array)
                contre_indications JSON,
                
                -- Observations
                observations TEXT,
                
                -- Statut final
                statut ENUM('VALIDE', 'REJETE', 'EN_ATTENTE') DEFAULT 'EN_ATTENTE',
                
                -- Audit
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                
                INDEX idx_candidate (candidate_id),
                INDEX idx_statut (statut),
                INDEX idx_date (date_visite)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Table visites_medicales created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

createVisitesMedicalesTable();
