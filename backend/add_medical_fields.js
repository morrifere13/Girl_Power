const db = require('./config/db');

async function addMedicalFields() {
    const connection = await db.getConnection();
    try {
        console.log('🏥 Ajout des champs médicaux (taille, poids, IMC)...\n');

        // Ajouter taille (en cm)
        try {
            await connection.query('ALTER TABLE visites_medicales ADD COLUMN taille DECIMAL(5,2) NULL COMMENT "Taille en cm" AFTER medecin_nom');
            console.log('✅ Colonne taille ajoutée');
        } catch (e) {
            console.log('ℹ️  taille existe déjà');
        }

        // Ajouter poids (en kg)
        try {
            await connection.query('ALTER TABLE visites_medicales ADD COLUMN poids DECIMAL(5,2) NULL COMMENT "Poids en kg" AFTER taille');
            console.log('✅ Colonne poids ajoutée');
        } catch (e) {
            console.log('ℹ️  poids existe déjà');
        }

        // Ajouter IMC (calculé automatiquement)
        try {
            await connection.query('ALTER TABLE visites_medicales ADD COLUMN imc DECIMAL(4,2) NULL COMMENT "IMC calculé automatiquement" AFTER poids');
            console.log('✅ Colonne imc ajoutée');
        } catch (e) {
            console.log('ℹ️  imc existe déjà');
        }

        // Ajouter interpretation_imc
        try {
            await connection.query('ALTER TABLE visites_medicales ADD COLUMN interpretation_imc VARCHAR(50) NULL COMMENT "Interprétation: Maigreur, Normal, Surpoids, Obésité" AFTER imc');
            console.log('✅ Colonne interpretation_imc ajoutée');
        } catch (e) {
            console.log('ℹ️  interpretation_imc existe déjà');
        }

        // Ajouter groupe_sanguin
        try {
            await connection.query('ALTER TABLE visites_medicales ADD COLUMN groupe_sanguin VARCHAR(10) NULL COMMENT "A+, A-, B+, B-, O+, O-, AB+, AB-" AFTER interpretation_imc');
            console.log('✅ Colonne groupe_sanguin ajoutée');
        } catch (e) {
            console.log('ℹ️  groupe_sanguin existe déjà');
        }

        // Ajouter tension_arterielle
        try {
            await connection.query('ALTER TABLE visites_medicales ADD COLUMN tension_arterielle VARCHAR(20) NULL COMMENT "Ex: 120/80" AFTER groupe_sanguin');
            console.log('✅ Colonne tension_arterielle ajoutée');
        } catch (e) {
            console.log('ℹ️  tension_arterielle existe déjà');
        }

        // Ajouter allergies
        try {
            await connection.query('ALTER TABLE visites_medicales ADD COLUMN allergies TEXT NULL COMMENT "Liste des allergies" AFTER tension_arterielle');
            console.log('✅ Colonne allergies ajoutée');
        } catch (e) {
            console.log('ℹ️  allergies existe déjà');
        }

        // Ajouter maladies_chroniques
        try {
            await connection.query('ALTER TABLE visites_medicales ADD COLUMN maladies_chroniques TEXT NULL COMMENT "Maladies chroniques connues" AFTER allergies');
            console.log('✅ Colonne maladies_chroniques ajoutée');
        } catch (e) {
            console.log('ℹ️  maladies_chroniques existe déjà');
        }

        console.log('\n🎉 Champs médicaux ajoutés avec succès!');
        console.log('\n📋 Nouveaux champs:');
        console.log('   - taille (cm)');
        console.log('   - poids (kg)');
        console.log('   - imc (calculé auto)');
        console.log('   - interpretation_imc (Maigreur/Normal/Surpoids/Obésité)');
        console.log('   - groupe_sanguin');
        console.log('   - tension_arterielle');
        console.log('   - allergies');
        console.log('   - maladies_chroniques');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        connection.release();
    }
}

addMedicalFields();
