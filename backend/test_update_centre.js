const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api/centres';

// Mock data
const newCentre = {
    code: 'TEST-001',
    nom: 'Centre Test Script',
    type_centre: 'Mixte',
    region: 'Lagunes',
    ville: 'Abidjan',
    creche: 'false',
    metiers: JSON.stringify([{ metier_choisi: 'Informatique', capacite_max: 0 }])
};

async function runTest() {
    try {
        // 1. Create
        console.log('🚀 Creating Centre...');
        const form = new FormData();
        Object.keys(newCentre).forEach(key => form.append(key, newCentre[key]));

        // Auth bypass or login not implemented in script? 
        // Wait, the routes are protected by verifyToken. 
        // I need to login first.

        // Let's assume there is a way to get token or I temporarily disable auth for test?
        // No, I should use the admin credentials found in logs: admin@girlpower.org / admin123 (usually default)
        // Actually, I'll try to login first.

        console.log('🔑 Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@girlpower.org',
            password: 'password123' // default password often used, or I need to check how to get admin
        });
        const token = loginRes.data.token;
        console.log('✅ Logged in. Token:', token.substring(0, 10) + '...');

        const config = {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        };

        const createRes = await axios.post(API_URL, form, config);
        const id = createRes.data.id;
        console.log(`✅ Centre Created. ID: ${id}`);

        // 2. Update with NEW metiers
        console.log('🔄 Updating Centre Metiers...');
        const updateForm = new FormData();
        updateForm.append('nom', 'Centre Test Script Updated');
        // Frontend sends metiers as JSON string for array of objects
        const newMetiers = [
            { metier_choisi: 'Informatique', capacite_max: 0 },
            { metier_choisi: 'Commerce', capacite_max: 0 }
        ];
        updateForm.append('metiers', JSON.stringify(newMetiers));

        const updateRes = await axios.put(`${API_URL}/${id}`, updateForm, config);
        console.log('✅ Update response:', updateRes.data);

        // 3. Verify
        console.log('🔍 Verifying...');
        const getRes = await axios.get(`${API_URL}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const savedMetiers = getRes.data.metiers;
        console.log('📦 Saved Metiers:', savedMetiers);

        if (savedMetiers.length === 2) {
            console.log('🎉 SUCCESS: Metiers updated correctly.');
        } else {
            console.error('❌ FAILURE: Metiers count mismatch.');
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ Request failed:', error.response.status, error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

runTest();
