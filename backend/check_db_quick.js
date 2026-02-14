const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'girl_power_db'
};

async function checkAndFix() {
    console.log('Connecting to database...');
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected successfully.');

        // 1. Check if column lieu_naissance exists in candidates
        console.log('Checking candidates table schema...');
        const [columns] = await connection.query('DESCRIBE candidates');
        const hasLieu = columns.some(col => col.Field === 'lieu_naissance');

        if (hasLieu) {
            console.log('✅ Column lieu_naissance already exists.');
        } else {
            console.log('❌ Column lieu_naissance MISSING. Adding it now...');
            await connection.query('ALTER TABLE candidates ADD COLUMN lieu_naissance VARCHAR(100) AFTER age');
            console.log('✅ Column lieu_naissance added successfully.');
        }

        // Check verification for other fields user might have added but missed
        const newFields = [
            'region_chef_lieu', 'prix_transport', 'quartier', 'repere_logement', 'surnom',
            'telephone_2', 'niveau_etude', 'annee_diplome', 'activite_actuelle', 'revenu_mensuel',
            'plus_grande_somme_gere', 'situation_matrimoniale', 'nombre_enfants_charge',
            'pere_nom', 'pere_profession', 'pere_contact1', 'pere_contact2',
            'mere_nom', 'mere_profession', 'mere_contact1', 'mere_contact2',
            'urgence_nom', 'urgence_affiliation', 'urgence_contact1', 'urgence_contact2',
            'nni', 'date_validite_document', 'cmu', 'aej_numero'
        ];

        for (const field of newFields) {
            const hasField = columns.some(col => col.Field === field);
            if (!hasField) {
                console.log(`Adding missing field: ${field}`);
                let type = 'VARCHAR(255)';
                if (['prix_transport', 'annee_diplome', 'revenu_mensuel', 'plus_grande_somme_gere', 'nombre_enfants_charge'].includes(field)) {
                    type = 'INT';
                } else if (field === 'date_validite_document') {
                    type = 'DATE';
                } else if (field === 'repere_logement') {
                    type = 'TEXT';
                }

                try {
                    await connection.query(`ALTER TABLE candidates ADD COLUMN ${field} ${type}`);
                    console.log(`✅ Added ${field}`);
                } catch (e) {
                    console.error(`Error adding ${field}:`, e.message);
                }
            }
        }

    } catch (error) {
        console.error('Database Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkAndFix();
