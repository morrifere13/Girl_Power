const ExcelJS = require('exceljs');
const db = require('../config/db');

/**
 * Génère le fichier Excel complet des candidates
 */
const generateCandidatesExcel = async (candidates) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates');

    // Définir les colonnes
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nom', key: 'nom', width: 20 },
        { header: 'Prénom', key: 'prenom', width: 20 },
        { header: 'Âge', key: 'age', width: 10 },
        { header: 'Statut', key: 'statut', width: 15 },
        { header: 'Téléphone', key: 'telephone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Ville', key: 'ville', width: 15 },
        { header: 'Quartier', key: 'quartier', width: 15 },
        { header: 'Niveau Étude', key: 'niveau_etude', width: 20 },
        { header: 'Métier Choisi', key: 'metier_choisi', width: 25 },
        { header: 'Date Inscription', key: 'created_at', width: 15 },
        // Colonnes supplémentaires
        { header: 'Sexe', key: 'sexe', width: 10 },
        { header: 'Date Naissance', key: 'date_naissance', width: 15 },
        { header: 'ID Document', key: 'numero_document', width: 20 },
        { header: 'NNI', key: 'nni', width: 20 },
        { header: 'Situation Matrimoniale', key: 'situation_matrimoniale', width: 20 },
        { header: 'Enfants', key: 'nombre_enfants', width: 10 }
    ];

    // Styliser l'en-tête
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDB2777' } // Girl Power Pink
    };

    // Ajouter les données
    candidates.forEach(candidate => {
        worksheet.addRow({
            ...candidate,
            created_at: new Date(candidate.created_at).toLocaleDateString()
        });
    });

    // Bordures pour toutes les cellules
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    return workbook;
};

module.exports = {
    generateCandidatesExcel
};
