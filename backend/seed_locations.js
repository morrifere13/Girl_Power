const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const EXCEL_PATH = path.join(__dirname, '../../administratifs officiels.xlsx');

async function seedLocations() {
    let connection;
    try {
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        // 1. Create Table
        console.log('🔨 Creating/Resetting "locations" table...');
        await connection.query('DROP TABLE IF EXISTS locations');
        await connection.query(`
            CREATE TABLE locations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                district VARCHAR(100),
                region VARCHAR(100),
                departement VARCHAR(100),
                sous_prefecture VARCHAR(100),
                localite VARCHAR(150),
                INDEX idx_region (region),
                INDEX idx_localite (localite)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Read Excel
        console.log('📂 Reading Excel file...');
        const workbook = XLSX.readFile(EXCEL_PATH);
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`   Found ${rows.length} administrative rows.`);

        // 3. Prepare Data
        console.log('⚙️  Processing data...');
        const records = [];
        let skipped = 0;

        for (const row of rows) {
            const district = (row['District'] || '').trim();
            const region = (row['Région'] || '').trim();
            const departement = (row['Département'] || '').trim();
            const sp = (row['Sous-Préfecture'] || '').trim();
            const localitesRaw = row['Localité']; // Can be string or number

            if (!localitesRaw) {
                skipped++;
                continue;
            }

            // Split localites by comma (and maybe newline if exists)
            const localitesList = localitesRaw.toString().split(/[,;]/).map(l => l.trim()).filter(l => l.length > 0);

            for (const loc of localitesList) {
                records.push([district, region, departement, sp, loc]);
            }
        }

        console.log(`   Processed ${records.length} unique location entries.`);

        // 4. Bulk Insert (Batching to avoid packet limit)
        console.log('💾 Inserting into database...');
        const BATCH_SIZE = 1000;
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            if (batch.length === 0) continue;

            const query = 'INSERT INTO locations (district, region, departement, sous_prefecture, localite) VALUES ?';
            await connection.query(query, [batch]);
            process.stdout.write(`   Inserted ${Math.min(i + BATCH_SIZE, records.length)} / ${records.length}\r`);
        }

        console.log('\n✅ Seeding completed successfully!');

    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

seedLocations();
