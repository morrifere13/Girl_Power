require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Tables existantes:');
    const [tables] = await connection.query('SHOW TABLES');
    tables.forEach(table => console.log(' -', Object.values(table)[0]));

    await connection.end();
}

checkDatabase();
