const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const regionChefLieux = {
    "N’ZI": "Dimbokro",
    "IFFOU": "Daoukro",
    "BÉLIER": "Toumodi",
    "MORONOU": "Bongouanou",
    "INDÉNIÉ-DJUABLIN": "Abengourou",
    "SUD-COMOÉ": "Aboisso",
    "FOLON": "Minignan",
    "KABADOUGOU": "Odienné",
    "GOH": "Gagnoa",
    "LÔH-DJIBOUA": "Divo",
    "AGNÉBY-TIASSA": "Agboville",
    "LA MÉ": "Adzopé",
    "GRANDS-PONTS": "Dabou",
    "TONKPI": "Man",
    "CAVALLY": "Guiglo",
    "GUÉMON": "Duékoué",
    "HAUT-SASSANDRA": "Daloa",
    "LA MARAHOUÉ": "Bouaflé",
    "PORO": "Korhogo",
    "TCHOLOGO": "Ferkessédougou",
    "BAGOUÉ": "Boundiali",
    "NAWA": "Soubré",
    "SAN-PEDRO": "San-Pédro",
    "GBÔKLÈ": "Sassandra",
    "HAMBOL": "Katiola",
    "GBÈKÈ": "Bouaké",
    "BÉRÉ": "Mankono",
    "BAFING": "Touba",
    "WORODOUGOU": "Séguéla",
    "BOUNKANI": "Bouna",
    "GONTOUGO": "Bondoukou",
    "DISTRICT AUTONOME D'ABIDJAN": "Abidjan",
    "DISTRICT AUTONOME DE YAMOUSSOUKRO": "Yamoussoukro"
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Check if column exists, if not add it
        const [columns] = await connection.query("SHOW COLUMNS FROM locations LIKE 'chef_lieu_region'");
        if (columns.length === 0) {
            console.log("Adding chef_lieu_region column...");
            await connection.query("ALTER TABLE locations ADD COLUMN chef_lieu_region VARCHAR(100) AFTER region");
            console.log("Column added.");
        } else {
            console.log("Column chef_lieu_region already exists.");
        }

        // 2. Update data
        console.log("Updating chef-lieux data...");
        for (const [region, chefLieu] of Object.entries(regionChefLieux)) {
            // Use TRIM(region) AND LIKE to be safe, though = should work if exact match
            const [result] = await connection.query(
                "UPDATE locations SET chef_lieu_region = ? WHERE TRIM(region) = ?",
                [chefLieu, region.trim()]
            );
            console.log(`Region: ${region.padEnd(20)} | Matched: ${result.affectedRows} | Updated: ${result.changedRows}`);
        }

        console.log("Migration complete!");

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
