const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Créer un compte admin
const adminData = {
    nom: 'Admin',
    prenom: 'Girl Power',
    email: 'admin@girlpower.ci',
    password: 'admin123',
    role: 'admin'
};

async function createAdmin() {
    try {
        console.log('👤 Création du compte administrateur...');
        const response = await axios.post(`${API_URL}/auth/register`, adminData);
        console.log('✅ Compte admin créé avec succès!');
        console.log('\n📧 Email:', adminData.email);
        console.log('🔑 Mot de passe:', adminData.password);
        console.log('\n✨ Vous pouvez maintenant lancer le seeding avec: node seed_auto.js');
        process.exit(0);
    } catch (error) {
        if (error.response?.data?.error?.includes('existe déjà')) {
            console.log('ℹ️  Le compte admin existe déjà');
            console.log('\n📧 Utilisez les identifiants:');
            console.log('   Email:', adminData.email);
            console.log('   Mot de passe:', adminData.password);
            console.log('\n✨ Lancez maintenant: node seed_auto.js');
            process.exit(0);
        } else {
            console.error('❌ Erreur:', error.response?.data || error.message);
            process.exit(1);
        }
    }
}

createAdmin();
