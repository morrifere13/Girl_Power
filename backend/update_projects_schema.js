const db = require('./config/db');

async function updateProjectsSchema() {
    try {
        console.log('🏗️ Updating Projects table schema...');

        // Add columns individually (ignore duplicates via catch)
        const columns = [
            "cible_quantitative INT DEFAULT 0",
            "objectif_reclassement FLOAT DEFAULT 0",
            "taux_abandon_max FLOAT DEFAULT 0",
            "convention_url VARCHAR(255)",
            "tdr_url VARCHAR(255)"
        ];

        for (const col of columns) {
            try {
                await db.query(`ALTER TABLE projects ADD COLUMN ${col}`);
                console.log(`   + Added ${col.split(' ')[0]}`);
            } catch (err) {
                // Ignore if exists
                if (err.code !== 'ER_DUP_FIELDNAME') {
                    // console.warn(`   = Validated ${col.split(' ')[0]}`);
                }
            }
        }

        // Create documents table
        try {
            await db.query(`
                 CREATE TABLE IF NOT EXISTS project_documents (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    project_id INT,
                    type_doc ENUM('RAPPORT', 'AUTRE') DEFAULT 'AUTRE',
                    nom_fichier VARCHAR(255),
                    chemin_fichier VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                )
            `);
            console.log('   + Verified/Created project_documents table');
        } catch (err) {
            console.error('Error creating doc table:', err);
        }

        console.log('✅ Projects schema updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating schema:', error);
        process.exit(1);
    }
}

updateProjectsSchema();
