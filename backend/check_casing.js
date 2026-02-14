const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkCasing() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // Check casing of first 5 rows
        const [rows] = await connection.query("SELECT localite, sous_prefecture, departement FROM locations LIMIT 5");
        console.log('Sample Data:', rows);

        // Check if "dimbokro" matches "DIMBOKRO"
        const [caseCheck] = await connection.query("SELECT 'Match' as result FROM DUAL WHERE 'dimbokro' LIKE 'DIMBOKRO'");
        console.log('Case Insensitive Check (dimbokro LIKE DIMBOKRO):', caseCheck);

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkCasing();
