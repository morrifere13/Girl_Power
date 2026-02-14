const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function testLogin() {
    try {
        const email = 'admin@girlpower.org';
        const password = 'Admin123!';

        console.log('🔐 Test de connexion...\n');
        console.log('Email:', email);
        console.log('Password:', password);

        // 1. Récupérer l'utilisateur
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            console.log('\n❌ Utilisateur non trouvé');
            process.exit(1);
        }

        const user = users[0];
        console.log('\n✅ Utilisateur trouvé:');
        console.log('  - ID:', user.id);
        console.log('  - Email:', user.email);
        console.log('  - Nom:', user.nom);
        console.log('  - Prénom:', user.prenom);
        console.log('  - Rôle:', user.role);
        console.log('  - Statut:', user.statut);
        console.log('  - Hash mot de passe:', user.password.substring(0, 20) + '...');

        // 2. Vérifier le statut
        if (user.statut !== 'actif') {
            console.log('\n❌ Compte inactif ou suspendu');
            process.exit(1);
        }

        console.log('\n✅ Statut actif');

        // 3. Vérifier le mot de passe
        console.log('\n🔑 Vérification du mot de passe...');
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('❌ Mot de passe incorrect');

            // Test avec d'autres mots de passe courants
            console.log('\n🔍 Test avec d\'autres mots de passe...');
            const testPasswords = ['admin123', 'Admin123', 'admin'];
            for (const testPwd of testPasswords) {
                const test = await bcrypt.compare(testPwd, user.password);
                console.log(`  - "${testPwd}": ${test ? '✅ MATCH!' : '❌'}`);
            }

            process.exit(1);
        }

        console.log('✅ Mot de passe correct');
        console.log('\n🎉 Connexion réussie!');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testLogin();
