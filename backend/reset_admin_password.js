const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetAdminPassword() {
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

        // Nouveau mot de passe
        const newPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe de l'admin
        const [result] = await connection.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, 'admin@girlpower.org']
        );

        if (result.affectedRows > 0) {
            console.log('✅ Mot de passe admin réinitialisé avec succès !');
            console.log('\n📋 INFORMATIONS DE CONNEXION:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email:       admin@girlpower.org');
            console.log('🔑 Mot de passe: Admin123!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
            console.log('⚠️  Aucun utilisateur admin trouvé avec cet email');
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Connexion fermée');
        }
    }
}

// Exécuter la fonction
resetAdminPassword();
