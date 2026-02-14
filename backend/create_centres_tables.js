const db = require('./config/db');

async function createCentresTables() {
    try {
        console.log('🏗 Creating table: centres...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS centres (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE,
                nom VARCHAR(255) NOT NULL,
                type_centre VARCHAR(100),
                region VARCHAR(100),
                ville VARCHAR(100),
                adresse TEXT,
                latitude DECIMAL(10, 8),
                longitude DECIMAL(10, 8),
                telephone VARCHAR(20),
                email VARCHAR(255),
                responsable_nom VARCHAR(255),
                responsable_contact VARCHAR(20),
                capacite_accueil INT DEFAULT 0,
                date_ouverture DATE,
                statut VARCHAR(50) DEFAULT 'ACTIF',
                photo_url VARCHAR(500),
                description TEXT,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('🏗 Creating table: centre_metiers...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS centre_metiers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                centre_id INT NOT NULL,
                metier_choisi VARCHAR(255),
                capacite_max INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Centres tables created successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
}

createCentresTables();
