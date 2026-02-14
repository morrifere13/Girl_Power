const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'girl_power_db'
};

async function checkCount() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT COUNT(*) as total FROM candidates');
        console.log(`Total candidates in DB: ${rows[0].total}`);

        const [candidates] = await connection.query('SELECT id, nom, prenom FROM candidates');
        console.log('Candidates list:');
        candidates.forEach(c => console.log(`- [${c.id}] ${c.nom} ${c.prenom}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkCount();
