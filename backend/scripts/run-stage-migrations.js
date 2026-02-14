/**
 * Script d'exécution des migrations pour le module de gestion des stages
 * Utilise la connexion DB configurée dans l'application
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Configuration de la connexion
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true  // Permet d'exécuter plusieurs requêtes
};

async function runMigrations() {
    let connection;

    try {
        console.log('🔌 Connexion à la base de données...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connecté à la base de données:', process.env.DB_NAME);

        // Lire le fichier de migration consolidé
        const migrationPath = path.join(__dirname, '../migrations/RUN_ALL_STAGE_MIGRATIONS.sql');
        console.log('\n📄 Lecture du fichier de migration...');
        const sqlContent = await fs.readFile(migrationPath, 'utf8');

        console.log('🚀 Exécution des migrations...\n');

        // Exécuter le script SQL
        const [results] = await connection.query(sqlContent);

        console.log('✅ Migrations exécutées avec succès!\n');

        // Vérifier les tables créées
        console.log('🔍 Vérification des tables créées...');

        const [tables] = await connection.query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ?
            AND (TABLE_NAME LIKE '%entreprise%' OR TABLE_NAME LIKE '%stage%')
            ORDER BY TABLE_NAME
        `, [process.env.DB_NAME]);

        console.log('\n📊 Tables créées:');
        tables.forEach(table => {
            console.log(`   ✓ ${table.TABLE_NAME}`);
        });

        // Vérifier les colonnes ajoutées à candidates
        console.log('\n🔍 Vérification des colonnes ajoutées à la table candidates...');

        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'candidates'
            AND COLUMN_NAME IN ('en_stage', 'nombre_stages_effectues', 'dernier_stage_id', 'disponible_stage')
            ORDER BY COLUMN_NAME
        `, [process.env.DB_NAME]);

        console.log('\n📊 Colonnes ajoutées à candidates:');
        columns.forEach(col => {
            console.log(`   ✓ ${col.COLUMN_NAME} (${col.COLUMN_TYPE}) - ${col.COLUMN_COMMENT || 'N/A'}`);
        });

        // Afficher les statistiques
        console.log('\n📈 Statistiques des tables:');

        const statsQueries = [
            { name: 'entreprises', query: 'SELECT COUNT(*) as count FROM entreprises WHERE deleted_at IS NULL' },
            { name: 'stages', query: 'SELECT COUNT(*) as count FROM stages WHERE deleted_at IS NULL' },
            { name: 'stage_evaluations', query: 'SELECT COUNT(*) as count FROM stage_evaluations' }
        ];

        for (const stat of statsQueries) {
            try {
                const [result] = await connection.query(stat.query);
                console.log(`   ${stat.name}: ${result[0].count} enregistrements`);
            } catch (err) {
                console.log(`   ${stat.name}: Table créée (0 enregistrements)`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✨ MIGRATIONS TERMINÉES AVEC SUCCÈS! ✨');
        console.log('='.repeat(60));
        console.log('\n💡 Prochaines étapes:');
        console.log('   1. Démarrer le backend: npm start');
        console.log('   2. Démarrer le frontend: cd ../frontend && npm run dev');
        console.log('   3. Tester la création d\'entreprises sur /entreprises');
        console.log('   4. Tester la création de stages sur /stages\n');

    } catch (error) {
        console.error('\n❌ Erreur lors de l\'exécution des migrations:');
        console.error(error.message);

        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('\n⚠️  Les tables existent déjà. Migration ignorée.');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Impossible de se connecter à la base de données.');
            console.log('   Vérifiez que MySQL est démarré et que les variables d\'environnement sont correctes.');
        } else if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('\n⚠️  Certaines colonnes existent déjà. Migration partiellement ignorée.');
        } else {
            console.error('\nDétails:', error);
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connexion fermée.\n');
        }
    }
}

// Exécuter les migrations
console.log('\n' + '='.repeat(60));
console.log('🚀 EXÉCUTION DES MIGRATIONS - MODULE STAGES');
console.log('='.repeat(60) + '\n');

runMigrations();
