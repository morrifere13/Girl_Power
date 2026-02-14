const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function testSanPedro() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        const region = "SAN-PEDRO"; // User said San Pedro
        const q = "Tabou"; // User mentioned Tabou department

        console.log(`Testing Search: Region='${region}', Query='${q}'`);

        // The exact query from routes/locations.js
        let query = `SELECT DISTINCT localite as ville, region, chef_lieu_region, sous_prefecture, departement
                     FROM locations
                     WHERE (
                        localite LIKE ? 
                        OR sous_prefecture LIKE ? 
                        OR departement LIKE ?
                     )`;

        const searchTerm = `%${q}%`;
        const params = [searchTerm, searchTerm, searchTerm];

        if (region) {
            query += ` AND region = ?`;
            params.push(region);
        }

        query += ` ORDER BY localite ASC LIMIT 20`; // Limit to 20 for readability

        const [rows] = await connection.query(query, params);

        console.log(`Found ${rows.length} results.`);
        console.log('--- Results Sample ---');
        rows.forEach(r => {
            console.log(`[${r.ville}] (SP: ${r.sous_prefecture}, Dept: ${r.departement})`);
        });

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testSanPedro();
