const db = require('./config/db');

async function addRelations() {
    const connection = await db.getConnection();
    try {
        console.log('🏗️  Ajout des relations à la table candidates...\n');

        // 1. Ajouter centre_id
        try {
            await connection.query('ALTER TABLE candidates ADD COLUMN centre_id INT NULL AFTER statut');
            console.log('✅ Colonne centre_id ajoutée');
        } catch (e) {
            console.log('ℹ️  centre_id existe déjà');
        }

        // 2. Ajouter projet_id
        try {
            await connection.query('ALTER TABLE candidates ADD COLUMN projet_id INT NULL AFTER centre_id');
            console.log('✅ Colonne projet_id ajoutée');
        } catch (e) {
            console.log('ℹ️  projet_id existe déjà');
        }

        // 3. Ajouter cohorte_id
        try {
            await connection.query('ALTER TABLE candidates ADD COLUMN cohorte_id INT NULL AFTER projet_id');
            console.log('✅ Colonne cohorte_id ajoutée');
        } catch (e) {
            console.log('ℹ️  cohorte_id existe déjà');
        }

        // 4. Ajouter les clés étrangères
        try {
            await connection.query('ALTER TABLE candidates ADD CONSTRAINT fk_candidates_centre FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE SET NULL');
            console.log('✅ Clé étrangère centre_id ajoutée');
        } catch (e) {
            console.log('ℹ️  Clé étrangère centre_id existe déjà');
        }

        try {
            await connection.query('ALTER TABLE candidates ADD CONSTRAINT fk_candidates_projet FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE SET NULL');
            console.log('✅ Clé étrangère projet_id ajoutée');
        } catch (e) {
            console.log('ℹ️  Clé étrangère projet_id existe déjà');
        }

        try {
            await connection.query('ALTER TABLE candidates ADD CONSTRAINT fk_candidates_cohorte FOREIGN KEY (cohorte_id) REFERENCES cohortes(id) ON DELETE SET NULL');
            console.log('✅ Clé étrangère cohorte_id ajoutée');
        } catch (e) {
            console.log('ℹ️  Clé étrangère cohorte_id existe déjà');
        }

        // 5. Ajouter les index
        try {
            await connection.query('CREATE INDEX idx_candidates_centre ON candidates(centre_id)');
            console.log('✅ Index centre_id créé');
        } catch (e) {
            console.log('ℹ️  Index centre_id existe déjà');
        }

        try {
            await connection.query('CREATE INDEX idx_candidates_projet ON candidates(projet_id)');
            console.log('✅ Index projet_id créé');
        } catch (e) {
            console.log('ℹ️  Index projet_id existe déjà');
        }

        try {
            await connection.query('CREATE INDEX idx_candidates_cohorte ON candidates(cohorte_id)');
            console.log('✅ Index cohorte_id créé');
        } catch (e) {
            console.log('ℹ️  Index cohorte_id existe déjà');
        }

        console.log('\n🎉 Migration terminée avec succès!');
        console.log('\n💡 Chaque candidate peut maintenant être liée à:');
        console.log('   - 1 centre unique');
        console.log('   - 1 projet unique');
        console.log('   - 1 cohorte unique');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        connection.release();
    }
}

addRelations();
