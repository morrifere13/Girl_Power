const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createAdminUser() {
    let connection;

    try {
        // Connexion à la base de données
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'girl_power_db'
        });

        console.log('✅ Connecté à la base de données');

        // Vérifier si l'utilisateur admin existe déjà
        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            ['admin@girlpower.org']
        );

        if (existingUsers.length > 0) {
            console.log('⚠️  L\'utilisateur admin existe déjà');
            console.log('📧 Email: admin@girlpower.org');
            console.log('🔑 Mot de passe: Admin123!');
            return;
        }

        // Hash du mot de passe
        const password = 'Admin123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur admin
        const [result] = await connection.query(
            `INSERT INTO users (nom, prenom, email, password, role, statut, date_creation)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            ['ADMIN', 'Système', 'admin@girlpower.org', hashedPassword, 'admin', 'actif']
        );

        console.log('✅ Utilisateur admin créé avec succès !');
        console.log('\n📋 INFORMATIONS DE CONNEXION:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:       admin@girlpower.org');
        console.log('🔑 Mot de passe: Admin123!');
        console.log('👤 Rôle:        admin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🚀 Tu peux maintenant te connecter à l\'application !');
        console.log('   URL: http://localhost:5173/login');

    } catch (error) {
        console.error('❌ Erreur:', error.message);

        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n💡 La table users n\'existe pas encore.');
            console.log('   Exécute d\'abord le script de migration:');
            console.log('   node migrate_auth.js');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Connexion fermée');
        }
    }
}

// Exécuter la fonction
createAdminUser();
