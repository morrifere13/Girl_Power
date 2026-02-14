const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkData() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const regionsToCheck = ["N’ZI", "IFFOU", "DISTRICT AUTONOME DE YAMOUSSOUKRO"];

        for (const region of regionsToCheck) {
            const [rows] = await connection.query(
                "SELECT region, chef_lieu_region FROM locations WHERE region = ? LIMIT 1",
                [region]
            );
            if (rows.length > 0) {
                console.log(`Region: ${rows[0].region} | Chef-Lieu: '${rows[0].chef_lieu_region}'`);
            } else {
                console.log(`Region: ${region} not found.`);
            }
        }

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkData();
