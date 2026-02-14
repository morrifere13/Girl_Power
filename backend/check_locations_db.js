const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkLocations() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Check columns
        const [columns] = await connection.query('SHOW COLUMNS FROM locations');
        console.log('Columns:', columns.map(c => c.Field).join(', '));

        // Check sample data
        const [rows] = await connection.query('SELECT region, chef_lieu_region, localite, sous_prefecture FROM locations LIMIT 5');
        console.log('Sample data:', rows);

        // Check distinct regions and their chef-lieux
        const [regions] = await connection.query('SELECT DISTINCT region, chef_lieu_region FROM locations WHERE region IS NOT NULL LIMIT 20');
        console.log('Distinct Regions and Chef-lieux:', regions);

        // Check specific region from user image if possible, e.g. "N'Zi"
        const [nzi] = await connection.query('SELECT * FROM locations WHERE region = "N\'Zi" LIMIT 1');
        console.log('N\'Zi data:', nzi);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkLocations();
