const db = require('./config/db');

async function checkSchema() {
    try {
        const [rows] = await db.query("DESCRIBE centres");
        console.log("Create Table Columns:");
        rows.forEach(row => console.log(`${row.Field} (${row.Type})`));
        process.exit(0);
    } catch (error) {
        console.error('Error describing table:', error);
        process.exit(1);
    }
}

checkSchema();
