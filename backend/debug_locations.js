const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function debugUpdate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        // 1. Check a specific region
        const target = "N’ZI"; // Note the curly quote
        const [rows] = await connection.query("SELECT id, region, md5(region), hex(region), chef_lieu_region FROM locations WHERE region LIKE ?", ['%N%ZI%']);
        console.log(`Found ${rows.length} rows for N'ZI-like pattern:`);
        if (rows.length > 0) {
            console.log('Sample row:', rows[0]);
            console.log('Region form DB:', rows[0].region);
            console.log('Target string :', target);
            console.log('Equal?', rows[0].region === target);
        }

        // 2. Try explicit update
        const [updateResult] = await connection.query(
            "UPDATE locations SET chef_lieu_region = 'Dimbokro-TEST' WHERE region = ?",
            [rows[0].region] // Use the value directly from DB
        );
        console.log('Update result:', updateResult);

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

debugUpdate();
