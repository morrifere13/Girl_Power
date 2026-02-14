const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Add urgence_profession
        try {
            await connection.query("ALTER TABLE candidates ADD COLUMN urgence_profession VARCHAR(255)");
            console.log('Added urgence_profession column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('urgence_profession column already exists.');
            } else {
                throw err;
            }
        }

        // Add pere_vivant
        try {
            await connection.query("ALTER TABLE candidates ADD COLUMN pere_vivant BOOLEAN DEFAULT TRUE");
            console.log('Added pere_vivant column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('pere_vivant column already exists.');
            } else {
                throw err;
            }
        }

        // Add mere_vivante
        try {
            await connection.query("ALTER TABLE candidates ADD COLUMN mere_vivante BOOLEAN DEFAULT TRUE");
            console.log('Added mere_vivante column.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('mere_vivante column already exists.');
            } else {
                throw err;
            }
        }

        console.log('Migration completed successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
