const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.');

        // Create users table
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nom VARCHAR(255) NOT NULL,
                prenom VARCHAR(255) NOT NULL,
                role ENUM('admin', 'gestionnaire', 'consultant') DEFAULT 'consultant',
                statut ENUM('actif', 'inactif', 'suspendu') DEFAULT 'actif',
                derniere_connexion DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_role (role),
                INDEX idx_statut (statut)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.query(createUsersTable);
        console.log('✅ Table "users" created successfully.');

        // Check if admin already exists
        const [existingAdmin] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            ['admin@girlpower.org']
        );

        if (existingAdmin.length === 0) {
            // Create default admin user
            const hashedPassword = await bcrypt.hash('Admin@2026', 10);
            await connection.query(
                `INSERT INTO users (email, password, nom, prenom, role, statut) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['admin@girlpower.org', hashedPassword, 'Admin', 'System', 'admin', 'actif']
            );
            console.log('✅ Default admin user created.');
            console.log('   📧 Email: admin@girlpower.org');
            console.log('   🔑 Password: Admin@2026');
        } else {
            console.log('ℹ️  Admin user already exists.');
        }

        console.log('\n🎉 Authentication migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
