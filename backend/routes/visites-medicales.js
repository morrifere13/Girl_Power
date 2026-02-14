const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Helper function to build query with filters (moved to top for use by multiple routes)
const buildFilterQuery = (filters) => {
    let baseQuery = `
        FROM visites_medicales vm
        LEFT JOIN candidates c ON vm.candidate_id = c.id
        LEFT JOIN cohortes co ON c.cohorte_id = co.id
        LEFT JOIN centres ce ON co.centre_id = ce.id
        LEFT JOIN projects p ON co.projet_id = p.id
        WHERE vm.deleted_at IS NULL
    `;
    const params = [];
    const { search, statut, date_debut, date_fin, projet_id, cohorte_id, centre_id, region, ville, sexe } = filters;

    if (search) {
        baseQuery += ' AND (c.nom LIKE ? OR c.prenom LIKE ? OR vm.medecin_nom LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (statut) { baseQuery += ' AND vm.statut = ?'; params.push(statut); }
    if (date_debut) { baseQuery += ' AND vm.date_visite >= ?'; params.push(date_debut); }
    if (date_fin) { baseQuery += ' AND vm.date_visite <= ?'; params.push(date_fin); }
    if (projet_id) { baseQuery += ' AND co.projet_id = ?'; params.push(projet_id); }
    if (cohorte_id) { baseQuery += ' AND c.cohorte_id = ?'; params.push(cohorte_id); }
    if (centre_id) { baseQuery += ' AND co.centre_id = ?'; params.push(centre_id); }
    if (region) { baseQuery += ' AND c.region = ?'; params.push(region); }
    if (ville) { baseQuery += ' AND c.ville = ?'; params.push(ville); }
    if (sexe) { baseQuery += ' AND c.sexe = ?'; params.push(sexe); }

    return { baseQuery, params };
};

// ============================================
// SPECIFIC ROUTES - MUST BE BEFORE /:id route
// ============================================

// GET stats with filters
router.get('/stats/overview', verifyToken, async (req, res) => {
    try {
        const { projet_id, cohorte_id, centre_id, region, ville, sexe } = req.query;

        let query = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN vm.statut = 'VALIDE' THEN 1 ELSE 0 END) as valides,
                SUM(CASE WHEN vm.statut = 'REJETE' THEN 1 ELSE 0 END) as rejetes,
                SUM(CASE WHEN vm.statut = 'EN_ATTENTE' THEN 1 ELSE 0 END) as en_attente,
                SUM(CASE WHEN vm.grossesse = 1 OR vm.test_grossesse = 'POSITIF' THEN 1 ELSE 0 END) as grossesse
            FROM visites_medicales vm
            LEFT JOIN candidates c ON vm.candidate_id = c.id
            LEFT JOIN cohortes co ON c.cohorte_id = co.id
            WHERE vm.deleted_at IS NULL
        `;

        const params = [];

        if (projet_id) {
            query += ' AND co.projet_id = ?';
            params.push(projet_id);
        }
        if (cohorte_id) {
            query += ' AND c.cohorte_id = ?';
            params.push(cohorte_id);
        }
        if (centre_id) {
            query += ' AND co.centre_id = ?';
            params.push(centre_id);
        }
        if (region) {
            query += ' AND c.region = ?';
            params.push(region);
        }
        if (ville) {
            query += ' AND c.ville = ?';
            params.push(ville);
        }
        if (sexe) {
            query += ' AND c.sexe = ?';
            params.push(sexe);
        }

        const [stats] = await db.query(query, params);

        res.json(stats[0]);
    } catch (error) {
        console.error('Error fetching stats:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// GET all visites medicales with advanced filters and pagination
router.get('/', verifyToken, async (req, res) => {
    try {
        const {
            candidate_id, statut, date_debut, date_fin, search,
            projet_id, cohorte_id, centre_id, region, ville, sexe,
            page = 1, limit = 20
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let baseQuery = `
            FROM visites_medicales vm
            LEFT JOIN candidates c ON vm.candidate_id = c.id
            LEFT JOIN cohortes co ON c.cohorte_id = co.id
            LEFT JOIN centres ce ON co.centre_id = ce.id
            LEFT JOIN projects p ON co.projet_id = p.id
            WHERE vm.deleted_at IS NULL
        `;

        const params = [];

        if (search) {
            baseQuery += ' AND (c.nom LIKE ? OR c.prenom LIKE ? OR vm.medecin_nom LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (candidate_id) {
            baseQuery += ' AND vm.candidate_id = ?';
            params.push(candidate_id);
        }

        if (statut) {
            baseQuery += ' AND vm.statut = ?';
            params.push(statut);
        }

        if (date_debut) {
            baseQuery += ' AND vm.date_visite >= ?';
            params.push(date_debut);
        }

        if (date_fin) {
            baseQuery += ' AND vm.date_visite <= ?';
            params.push(date_fin);
        }

        if (projet_id) {
            baseQuery += ' AND co.projet_id = ?';
            params.push(projet_id);
        }

        if (cohorte_id) {
            baseQuery += ' AND c.cohorte_id = ?';
            params.push(cohorte_id);
        }

        if (centre_id) {
            baseQuery += ' AND co.centre_id = ?';
            params.push(centre_id);
        }

        if (region) {
            baseQuery += ' AND c.region = ?';
            params.push(region);
        }

        if (ville) {
            baseQuery += ' AND c.ville = ?';
            params.push(ville);
        }

        if (sexe) {
            baseQuery += ' AND c.sexe = ?';
            params.push(sexe);
        }

        // Get total count
        const [countResult] = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
        const total = countResult[0].total;

        // Get paginated data
        let query = `
            SELECT vm.*,
                   c.nom as candidate_nom,
                   c.prenom as candidate_prenom,
                   c.sexe,
                   c.date_naissance,
                   c.telephone,
                   c.email,
                   c.region as candidate_region,
                   c.ville as candidate_ville,
                   c.photo,
                   co.nom as cohorte_nom,
                   ce.nom as centre_nom,
                   p.nom as projet_nom
            ${baseQuery}
            ORDER BY vm.date_visite DESC
            LIMIT ? OFFSET ?
        `;

        const [visites] = await db.query(query, [...params, parseInt(limit), offset]);

        const processedVisites = visites.map(v => ({
            ...v,
            examens: typeof v.examens === 'string' ? JSON.parse(v.examens) : v.examens,
            contre_indications: typeof v.contre_indications === 'string' ? JSON.parse(v.contre_indications) : v.contre_indications,
            observations: v.observations || ''
        }));

        res.json({
            data: processedVisites,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching visites medicales:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// EXPORT Excel - all or filtered (MUST BE BEFORE /:id)
router.get('/export/excel', verifyToken, async (req, res) => {
    try {
        const { baseQuery, params } = buildFilterQuery(req.query);

        const query = `
            SELECT vm.*,
                   c.nom as candidate_nom,
                   c.prenom as candidate_prenom,
                   c.sexe,
                   c.date_naissance,
                   c.telephone,
                   c.region as candidate_region,
                   c.ville as candidate_ville,
                   co.nom as cohorte_nom,
                   ce.nom as centre_nom,
                   p.nom as projet_nom
            ${baseQuery}
            ORDER BY vm.date_visite DESC
        `;

        const [visites] = await db.query(query, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Visites Médicales');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Candidate', key: 'candidate', width: 25 },
            { header: 'Sexe', key: 'sexe', width: 10 },
            { header: 'Région', key: 'region', width: 15 },
            { header: 'Ville', key: 'ville', width: 15 },
            { header: 'Cohorte', key: 'cohorte', width: 20 },
            { header: 'Centre', key: 'centre', width: 20 },
            { header: 'Projet', key: 'projet', width: 20 },
            { header: 'Date Visite', key: 'date_visite', width: 15 },
            { header: 'Médecin', key: 'medecin', width: 20 },
            { header: 'Établissement', key: 'etablissement', width: 20 },
            { header: 'Taille (cm)', key: 'taille', width: 12 },
            { header: 'Poids (kg)', key: 'poids', width: 12 },
            { header: 'IMC', key: 'imc', width: 10 },
            { header: 'Interprétation IMC', key: 'interpretation_imc', width: 18 },
            { header: 'Tension', key: 'tension', width: 12 },
            { header: 'Groupe Sanguin', key: 'groupe_sanguin', width: 15 },
            { header: 'Test Grossesse', key: 'test_grossesse', width: 15 },
            { header: 'Apte', key: 'apte', width: 10 },
            { header: 'Statut', key: 'statut', width: 12 },
            { header: 'Observations', key: 'observations', width: 30 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE04F65' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        visites.forEach(v => {
            worksheet.addRow({
                id: v.id,
                candidate: `${v.candidate_prenom} ${v.candidate_nom}`,
                sexe: v.sexe === 'F' ? 'Femme' : 'Homme',
                region: v.candidate_region,
                ville: v.candidate_ville,
                cohorte: v.cohorte_nom,
                centre: v.centre_nom,
                projet: v.projet_nom,
                date_visite: v.date_visite ? new Date(v.date_visite).toLocaleDateString('fr-FR') : '',
                medecin: v.medecin_nom,
                etablissement: v.etablissement,
                taille: v.taille,
                poids: v.poids,
                imc: v.imc,
                interpretation_imc: v.interpretation_imc,
                tension: v.tension_arterielle,
                groupe_sanguin: v.groupe_sanguin,
                test_grossesse: v.test_grossesse,
                apte: v.apte_physiquement ? 'Oui' : 'Non',
                statut: v.statut,
                observations: v.observations
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=visites_medicales_${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting Excel:', error);
        res.status(500).json({ error: 'Erreur export Excel' });
    }
});

// EXPORT PDF - single visite (MUST BE BEFORE /:id)
router.get('/export/pdf/:id', verifyToken, async (req, res) => {
    try {
        const [visites] = await db.query(`
            SELECT vm.*,
                   c.nom as candidate_nom,
                   c.prenom as candidate_prenom,
                   c.sexe,
                   c.date_naissance,
                   c.age,
                   c.telephone,
                   c.email,
                   c.region as candidate_region,
                   c.ville as candidate_ville,
                   c.adresse,
                   c.type_document,
                   c.numero_document,
                   c.metier_choisi,
                   c.photo,
                   c.nni,
                   co.nom as cohorte_nom,
                   ce.nom as centre_nom,
                   p.nom as projet_nom,
                   p.code as projet_code
            FROM visites_medicales vm
            LEFT JOIN candidates c ON vm.candidate_id = c.id
            LEFT JOIN cohortes co ON c.cohorte_id = co.id
            LEFT JOIN centres ce ON co.centre_id = ce.id
            LEFT JOIN projects p ON co.projet_id = p.id
            WHERE vm.id = ? AND vm.deleted_at IS NULL
        `, [req.params.id]);

        if (visites.length === 0) {
            return res.status(404).json({ error: 'Visite non trouvee' });
        }

        const v = visites[0];
        const pageW = 595.28; // A4 Portrait
        const pageH = 841.89;
        const M = 32; // marges reduites pour optimiser l'espace
        const W = pageW - M * 2;

        const doc = new PDFDocument({ margin: M, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=fiche_medicale_${v.id}.pdf`);
        doc.pipe(res);

        // Couleurs - style administratif sobre
        const C = {
            PRIMARY: '#1a2332',
            DARK: '#2d3748',
            LABEL: '#4a5568',
            BORDER: '#cbd5e0',
            HEADER_BG: '#1a2332',
            SECTION_BG: '#f7fafc',
            GREEN: '#166534',
            RED: '#991b1b',
            LIGHT_GREEN: '#dcfce7',
            LIGHT_RED: '#fee2e2',
            ACCENT: '#2563eb'
        };

        // --- Helpers ---
        const fillRect = (x, y, w, h, color) => {
            doc.save().rect(x, y, w, h).fill(color).restore();
        };
        const strokeRect = (x, y, w, h, color, lw) => {
            doc.save().lineWidth(lw || 0.5).rect(x, y, w, h).stroke(color).restore();
        };
        const fillStrokeRect = (x, y, w, h, fc, sc) => {
            doc.save().rect(x, y, w, h).fillAndStroke(fc, sc).restore();
        };
        const hLine = (x1, y1, x2, color, lw) => {
            doc.save().lineWidth(lw || 0.5).moveTo(x1, y1).lineTo(x2, y1).stroke(color).restore();
        };
        const vLine = (x, y1, y2, color, lw) => {
            doc.save().lineWidth(lw || 0.3).moveTo(x, y1).lineTo(x, y2).stroke(color).restore();
        };
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

        // Section header compact
        const sectionHead = (title, num, y) => {
            fillRect(M, y, W, 16, C.HEADER_BG);
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
               .text(`${num}. ${title}`, M + 6, y + 4.5, { width: W - 12 });
            return y + 16;
        };

        // Champ label: valeur
        const field = (label, value, x, y, lw, vw) => {
            doc.font('Helvetica-Bold').fontSize(7).fillColor(C.LABEL)
               .text(label, x, y, { width: lw || 90, lineBreak: false });
            doc.font('Helvetica').fontSize(7.5).fillColor('#000000')
               .text(String(value || '—'), x + (lw || 90), y, { width: vw || 140, lineBreak: false });
        };

        const dossierId = `VM-${new Date().getFullYear()}-${String(v.id).padStart(5, '0')}`;
        const projetNom = v.projet_nom || 'Projet';

        // ============================================================
        // EN-TETE : Nom du projet (pas de devise, pas de pays)
        // ============================================================
        let y = M;

        // Bandeau superieur
        fillRect(M, y, W, 2, C.ACCENT);
        y += 4;

        // Titre du projet centre
        doc.font('Helvetica-Bold').fontSize(14).fillColor(C.PRIMARY)
           .text(projetNom.toUpperCase(), M, y, { align: 'center', width: W });
        y += 18;
        if (v.projet_code) {
            doc.font('Helvetica').fontSize(7).fillColor(C.LABEL)
               .text(`Code projet : ${v.projet_code}`, M, y, { align: 'center', width: W });
            y += 10;
        }

        // Ligne separatrice fine
        hLine(M, y, M + W, C.BORDER, 0.5);
        y += 4;

        // Titre du document + Reference sur la meme ligne
        fillRect(M, y, W, 22, C.HEADER_BG);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff')
           .text('CERTIFICAT DE VISITE MEDICALE', M, y + 5.5, { align: 'center', width: W });
        doc.font('Helvetica').fontSize(6).fillColor('#ffffff')
           .text(`Ref: ${dossierId}`, M + W - 120, y + 8, { width: 115, align: 'right' });
        y += 24;

        // ============================================================
        // SECTION I - IDENTIFICATION + PHOTO
        // ============================================================
        const sec1Top = y;
        const sec1H = 82;
        strokeRect(M, sec1Top, W, sec1H, C.BORDER, 0.5);
        y = sectionHead('IDENTIFICATION DU CANDIDAT', 'I', y);

        // Photo a droite
        const photoW = 60;
        const photoH = 60;
        const photoX = M + W - photoW - 8;
        const photoY = y + 2;

        // Charger la photo du candidat si elle existe
        let photoLoaded = false;
        if (v.photo) {
            try {
                const photoPath = path.join(__dirname, '..', v.photo.startsWith('/') ? v.photo.substring(1) : v.photo);
                if (fs.existsSync(photoPath)) {
                    // Cadre photo avec fond gris clair
                    fillStrokeRect(photoX, photoY, photoW, photoH, '#f8f9fa', C.BORDER);
                    doc.image(photoPath, photoX + 2, photoY + 2, {
                        width: photoW - 4,
                        height: photoH - 4,
                        fit: [photoW - 4, photoH - 4],
                        align: 'center',
                        valign: 'center'
                    });
                    strokeRect(photoX, photoY, photoW, photoH, C.PRIMARY, 1);
                    photoLoaded = true;
                }
            } catch (e) {
                // Photo non disponible - on dessine un placeholder
            }
        }
        if (!photoLoaded) {
            fillStrokeRect(photoX, photoY, photoW, photoH, '#f1f5f9', C.BORDER);
            doc.font('Helvetica').fontSize(7).fillColor('#94a3b8')
               .text('Photo', photoX, photoY + 22, { width: photoW, align: 'center' })
               .text('N/D', photoX, photoY + 32, { width: photoW, align: 'center' });
            strokeRect(photoX, photoY, photoW, photoH, C.BORDER, 0.8);
        }

        // Champs identification (cote gauche, a cote de la photo)
        const infoW = W - photoW - 25;
        const c1 = M + 8;
        const c2 = M + infoW / 2 + 8;
        const lw1 = 75;
        const vw1 = infoW / 2 - lw1 - 10;

        field('Nom :', v.candidate_nom ? v.candidate_nom.toUpperCase() : '—', c1, y + 4, lw1, vw1);
        field('Prenom(s) :', v.candidate_prenom, c2, y + 4, lw1, vw1);
        field('Date naiss. :', fmtDate(v.date_naissance), c1, y + 17, lw1, vw1);
        field('Age :', v.age ? `${v.age} ans` : '—', c2, y + 17, lw1, vw1);
        field('Sexe :', v.sexe === 'F' ? 'Feminin' : v.sexe === 'M' ? 'Masculin' : v.sexe || '—', c1, y + 30, lw1, vw1);
        field('Telephone :', v.telephone, c2, y + 30, lw1, vw1);
        field(`${v.type_document || 'Piece'} :`, v.numero_document, c1, y + 43, lw1, vw1);
        field('Region/Ville :', `${v.candidate_region || ''}${v.candidate_ville ? ' / ' + v.candidate_ville : ''}`, c2, y + 43, lw1, vw1 + 20);

        // ============================================================
        // SECTION II - AFFECTATION
        // ============================================================
        y = sec1Top + sec1H + 2;
        const sec2H = 42;
        strokeRect(M, y, W, sec2H, C.BORDER, 0.5);
        y = sectionHead('AFFECTATION', 'II', y);

        const halfW = W / 2;
        vLine(M + halfW, y, y + 22, C.BORDER);
        field('Projet :', projetNom, c1, y + 3, lw1, halfW - lw1 - 15);
        field('Centre :', v.centre_nom || '—', M + halfW + 8, y + 3, lw1, halfW - lw1 - 15);
        field('Cohorte :', v.cohorte_nom || '—', c1, y + 15, lw1, halfW - lw1 - 15);
        field('Metier :', v.metier_choisi || '—', M + halfW + 8, y + 15, lw1, halfW - lw1 - 15);

        // ============================================================
        // SECTION III - EXAMEN MEDICAL
        // ============================================================
        y = y - 16 + sec2H + 2;
        const sec3Top = y;
        const sec3H = 114;
        strokeRect(M, sec3Top, W, sec3H, C.BORDER, 0.5);
        y = sectionHead('EXAMEN MEDICAL', 'III', y);

        // Info visite
        fillRect(M + 1, y, W - 2, 12, C.SECTION_BG);
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.PRIMARY)
           .text('Visite', c1, y + 3);
        y += 13;
        vLine(M + halfW, y, y + 14, C.BORDER);
        field('Date :', fmtDate(v.date_visite), c1, y + 1, 60, 100);
        field('Medecin :', v.medecin_nom ? `Dr. ${v.medecin_nom}` : '—', M + halfW + 8, y + 1, 60, halfW - 80);
        field('Etablissement :', v.etablissement || '—', c1, y + 12, 80, 120);
        field('Lieu :', v.ville_visite || '—', M + halfW + 8, y + 12, 60, halfW - 80);
        y += 26;

        // Separateur
        hLine(M + 5, y, M + W - 5, C.BORDER, 0.3);
        y += 2;

        // Mesures anthropometriques
        fillRect(M + 1, y, W - 2, 11, C.SECTION_BG);
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.PRIMARY)
           .text('Mesures anthropometriques', c1, y + 2.5);
        y += 13;

        // Tableau compact des mesures
        const measures = [
            { l: 'Taille', v: v.taille ? `${v.taille} cm` : '—' },
            { l: 'Poids', v: v.poids ? `${v.poids} kg` : '—' },
            { l: 'IMC', v: v.imc ? `${v.imc}` : '—' },
            { l: 'Tension', v: v.tension_arterielle || '—' },
            { l: 'Pouls', v: v.pouls || '—' },
            { l: 'Temp.', v: v.temperature ? `${v.temperature}°C` : '—' },
            { l: 'Gr. Sang.', v: v.groupe_sanguin || '—' }
        ];

        const mColW = (W - 10) / measures.length;
        measures.forEach((m, i) => {
            const mx = M + 5 + i * mColW;
            fillStrokeRect(mx, y, mColW, 12, '#edf2f7', C.BORDER);
            doc.font('Helvetica-Bold').fontSize(6).fillColor(C.DARK)
               .text(m.l, mx + 2, y + 3, { width: mColW - 4, align: 'center' });
            strokeRect(mx, y + 12, mColW, 14, C.BORDER);
            doc.font('Helvetica').fontSize(7).fillColor('#000000')
               .text(m.v, mx + 2, y + 15, { width: mColW - 4, align: 'center' });
        });
        y += 28;

        // Extras
        const extras = [];
        if (v.pignet) extras.push(`Pignet: ${v.pignet}`);
        if (v.interpretation_imc) extras.push(`IMC: ${v.interpretation_imc}`);
        if (v.asthmatique) extras.push('Asthmatique');
        if (v.handicap) extras.push('Handicap');
        if (extras.length > 0) {
            doc.font('Helvetica').fontSize(6).fillColor(C.LABEL)
               .text(extras.join('  |  '), c1, y + 1, { width: W - 20 });
        }

        // ============================================================
        // SECTION IV - EXAMENS CLINIQUES
        // ============================================================
        y = sec3Top + sec3H + 2;
        const sec4Top = y;
        const sec4H = v.sexe === 'F' ? 88 : 74;
        strokeRect(M, sec4Top, W, sec4H, C.BORDER, 0.5);
        y = sectionHead('EXAMENS CLINIQUES', 'IV', y);

        const exams = [
            { l: 'Vision', v: v.vision },
            { l: 'Audition', v: v.audition },
            { l: 'Bucco-dent.', v: v.buccodentaire },
            { l: 'Coeur/Poum.', v: v.coeur_poumons },
            { l: 'Abdomen', v: v.abdomen },
            { l: 'Peau', v: v.peau },
            { l: 'Mbr. sup.', v: v.membres_superieurs },
            { l: 'Mbr. inf.', v: v.membres_inferieurs },
            { l: 'Etat gen.', v: v.etat_general }
        ];

        const eColW = (W - 16) / 3;
        exams.forEach((ex, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const ex_x = M + 8 + col * eColW;
            const ex_y = y + 3 + row * 15;

            const isOk = ['Normal', 'RAS', 'Bon', 'Bon etat'].includes(ex.v);
            const dot = isOk ? C.GREEN : ex.v ? C.RED : '#cbd5e0';

            doc.save().circle(ex_x + 3, ex_y + 3.5, 2.5).fill(dot).restore();
            doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.DARK)
               .text(ex.l + ' :', ex_x + 10, ex_y, { width: 58, lineBreak: false });
            doc.font('Helvetica').fontSize(7).fillColor(ex.v ? '#000' : '#999')
               .text(ex.v || '—', ex_x + 68, ex_y, { width: eColW - 75, lineBreak: false });
        });

        // Test grossesse
        if (v.sexe === 'F') {
            const gY = y + 3 + 3 * 15 + 1;
            hLine(M + 5, gY - 3, M + W - 5, C.BORDER, 0.3);
            doc.font('Helvetica-Bold').fontSize(7).fillColor(C.DARK)
               .text('Test de grossesse :', M + 8, gY);
            const tLabel = v.test_grossesse === 'POSITIF' ? 'POSITIF' : v.test_grossesse === 'NEGATIF' ? 'NEGATIF' : 'Non effectue';
            const tColor = v.test_grossesse === 'POSITIF' ? C.RED : v.test_grossesse === 'NEGATIF' ? C.GREEN : '#718096';
            doc.font('Helvetica-Bold').fontSize(7).fillColor(tColor)
               .text(tLabel, M + 110, gY);

            if (v.allergies || v.maladies_chroniques) {
                const inf = [];
                if (v.allergies) inf.push(`Allergies: ${v.allergies}`);
                if (v.maladies_chroniques) inf.push(`Mal. chroniques: ${v.maladies_chroniques}`);
                doc.font('Helvetica').fontSize(6).fillColor(C.LABEL)
                   .text(inf.join('  |  '), M + 220, gY, { width: W - 230 });
            }
        } else if (v.allergies || v.maladies_chroniques) {
            const aY = y + 3 + 3 * 15;
            const inf = [];
            if (v.allergies) inf.push(`Allergies: ${v.allergies}`);
            if (v.maladies_chroniques) inf.push(`Mal. chroniques: ${v.maladies_chroniques}`);
            doc.font('Helvetica').fontSize(6).fillColor(C.LABEL)
               .text(inf.join('  |  '), c1, aY, { width: W - 20 });
        }

        // ============================================================
        // SECTION V - DECISION D'APTITUDE
        // ============================================================
        y = sec4Top + sec4H + 2;
        const sec5H = 52;
        strokeRect(M, y, W, sec5H, C.BORDER, 0.5);
        y = sectionHead('DECISION D\'APTITUDE', 'V', y);

        const isApte = v.statut === 'VALIDE' && v.apte_physiquement;
        const dColor = isApte ? C.GREEN : C.RED;
        const dBg = isApte ? C.LIGHT_GREEN : C.LIGHT_RED;
        const dBorder = isApte ? '#16a34a' : '#dc2626';

        // Cases APTE / INAPTE
        const boxW = 44;
        const boxH = 28;
        const boxY = y + 3;

        // APTE
        fillStrokeRect(M + 8, boxY, boxW, boxH, isApte ? dBg : '#fff', isApte ? dBorder : C.BORDER);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(isApte ? C.GREEN : C.LABEL)
           .text('APTE', M + 8, boxY + 10, { width: boxW, align: 'center' });
        if (isApte) {
            doc.save().lineWidth(1.5).strokeColor(C.GREEN)
               .moveTo(M + 18, boxY + 14).lineTo(M + 28, boxY + 22).lineTo(M + 44, boxY + 6)
               .stroke().restore();
        }

        // INAPTE
        fillStrokeRect(M + 58, boxY, boxW, boxH, !isApte ? dBg : '#fff', !isApte ? dBorder : C.BORDER);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(!isApte ? C.RED : C.LABEL)
           .text('INAPTE', M + 58, boxY + 10, { width: boxW, align: 'center' });
        if (!isApte) {
            doc.save().lineWidth(1.5).strokeColor(C.RED)
               .moveTo(M + 66, boxY + 7).lineTo(M + 94, boxY + 23)
               .moveTo(M + 94, boxY + 7).lineTo(M + 66, boxY + 23)
               .stroke().restore();
        }

        // Resultat texte
        doc.font('Helvetica-Bold').fontSize(14).fillColor(dColor)
           .text(isApte ? 'APTE' : 'INAPTE', M + 115, boxY + 6);

        // Observations
        strokeRect(M + halfW - 10, boxY, halfW + 10, boxH, C.BORDER);
        doc.font('Helvetica-Bold').fontSize(6.5).fillColor(C.DARK)
           .text('Observations :', M + halfW - 5, boxY + 3);
        doc.font('Helvetica').fontSize(6.5).fillColor('#000')
           .text(v.observations || 'Aucune observation particuliere', M + halfW - 5, boxY + 12, { width: halfW, height: 14 });

        // ============================================================
        // SECTION VI - SIGNATURES
        // ============================================================
        y = y - 16 + sec5H + 2;
        const sec6H = 62;
        strokeRect(M, y, W, sec6H, C.BORDER, 0.5);
        y = sectionHead('AUTHENTIFICATION', 'VI', y);

        const sigW = (W - 24) / 2;

        // Medecin
        strokeRect(M + 6, y + 2, sigW, 40, C.BORDER);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(C.PRIMARY)
           .text('Le Medecin Examinateur', M + 6, y + 5, { align: 'center', width: sigW });
        doc.font('Helvetica').fontSize(7).fillColor('#000')
           .text(v.medecin_nom ? `Dr. ${v.medecin_nom}` : '____________________', M + 6, y + 15, { align: 'center', width: sigW });
        doc.font('Helvetica').fontSize(6).fillColor(C.LABEL)
           .text('Signature et cachet', M + 6, y + 34, { align: 'center', width: sigW });

        // Etablissement
        const s2X = M + sigW + 18;
        strokeRect(s2X, y + 2, sigW, 40, C.BORDER);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(C.PRIMARY)
           .text('Cachet de l\'Etablissement', s2X, y + 5, { align: 'center', width: sigW });
        doc.font('Helvetica').fontSize(7).fillColor('#000')
           .text(v.etablissement || '____________________', s2X, y + 15, { align: 'center', width: sigW });
        doc.font('Helvetica').fontSize(6).fillColor(C.LABEL)
           .text(`Fait a ${v.ville_visite || '________'}, le ${fmtDate(v.date_visite)}`, s2X, y + 34, { align: 'center', width: sigW });

        // ============================================================
        // PIED DE PAGE
        // ============================================================
        const footerY = pageH - M - 14;
        fillRect(M, footerY, W, 14, C.HEADER_BG);
        doc.font('Helvetica').fontSize(5.5).fillColor('#ffffff')
           .text(`${projetNom}  |  Ref: ${dossierId}  |  Genere le ${fmtDate(new Date())}`, M + 6, footerY + 4, { width: W - 12, align: 'center' });

        // Ligne accent bas
        fillRect(M, footerY + 14, W, 2, C.ACCENT);

        doc.end();
    } catch (error) {
        console.error('Error exporting PDF:', error.message);
        console.error('PDF Stack:', error.stack);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur export PDF', details: error.message });
        }
    }
});

// GET candidates awaiting medical visit - Sélectionné status (MUST BE BEFORE /:id)
router.get('/candidates/pending', verifyToken, async (req, res) => {
    try {
        const { projet_id, cohorte_id, centre_id, region, ville, sexe, search, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let baseQuery = `
            FROM candidates c
            LEFT JOIN cohortes co ON c.cohorte_id = co.id
            LEFT JOIN centres ce ON co.centre_id = ce.id
            LEFT JOIN projects p ON co.projet_id = p.id
            WHERE c.statut = 'Sélectionné'
            AND c.id NOT IN (SELECT candidate_id FROM visites_medicales WHERE deleted_at IS NULL)
        `;

        const params = [];

        if (search) {
            baseQuery += ' AND (c.nom LIKE ? OR c.prenom LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (projet_id) { baseQuery += ' AND co.projet_id = ?'; params.push(projet_id); }
        if (cohorte_id) { baseQuery += ' AND c.cohorte_id = ?'; params.push(cohorte_id); }
        if (centre_id) { baseQuery += ' AND co.centre_id = ?'; params.push(centre_id); }
        if (region) { baseQuery += ' AND c.region = ?'; params.push(region); }
        if (ville) { baseQuery += ' AND c.ville = ?'; params.push(ville); }
        if (sexe) { baseQuery += ' AND c.sexe = ?'; params.push(sexe); }

        const [countResult] = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
        const total = countResult[0].total;

        const query = `
            SELECT c.id, c.nom, c.prenom, c.telephone, c.date_naissance, c.age, c.sexe,
                   c.ville, c.region, c.email, c.photo, c.metier_choisi,
                   c.nombre_enfants_charge, c.situation_matrimoniale,
                   co.nom as cohorte_nom, ce.nom as centre_nom, p.nom as projet_nom
            ${baseQuery}
            ORDER BY c.nom, c.prenom
            LIMIT ? OFFSET ?
        `;

        const [candidates] = await db.query(query, [...params, parseInt(limit), offset]);

        res.json({
            data: candidates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching pending candidates:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ============================================
// DYNAMIC ID ROUTES - MUST BE AFTER SPECIFIC ROUTES
// ============================================

// GET visite by ID
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [visites] = await db.query(`
            SELECT vm.*, 
                   c.nom as candidate_nom, 
                   c.prenom as candidate_prenom,
                   c.sexe,
                   c.date_naissance,
                   c.telephone,
                   c.email
            FROM visites_medicales vm
            LEFT JOIN candidates c ON vm.candidate_id = c.id
            WHERE vm.id = ? AND vm.deleted_at IS NULL
        `, [req.params.id]);
        
        if (visites.length === 0) {
            return res.status(404).json({ error: 'Visite médicale non trouvée' });
        }
        
        const visite = {
            ...visites[0],
            examens: typeof visites[0].examens === 'string' ? JSON.parse(visites[0].examens) : visites[0].examens,
            contre_indications: typeof visites[0].contre_indications === 'string' ? JSON.parse(visites[0].contre_indications) : visites[0].contre_indications
        };
        
        res.json(visite);
    } catch (error) {
        console.error('Error fetching visite:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST create visite
router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            candidate_id, date_visite, ville_visite, medecin_nom, etablissement,
            // Mesures physiques
            taille, poids, temperature,
            // Mesures complémentaires
            tension_arterielle, pouls, pignet,
            // Examens cliniques
            av, vision, audition, buccodentaire, bdc, peau,
            // Examens par systèmes
            coeur_poumons, abdomen, membres_superieurs, membres_inferieurs,
            // État général
            etat_general, asthmatique, handicap,
            // Spécifique femmes
            test_grossesse, grossesse,
            // Autres
            groupe_sanguin, allergies, maladies_chroniques,
            // Aptitude
            apte_physiquement, observations, examens, contre_indications
        } = req.body;

        // Calcul automatique de l'IMC si taille et poids sont fournis
        let imc = null;
        let interpretation_imc = null;
        if (taille && poids) {
            // IMC = poids (kg) / (taille (m))²
            const tailleEnMetres = taille / 100;
            imc = (poids / (tailleEnMetres * tailleEnMetres)).toFixed(2);

            // Interprétation de l'IMC selon l'OMS
            if (imc < 18.5) {
                interpretation_imc = 'Maigreur';
            } else if (imc < 25) {
                interpretation_imc = 'Normal';
            } else if (imc < 30) {
                interpretation_imc = 'Surpoids';
            } else {
                interpretation_imc = 'Obésité';
            }
        }
        
        // Vérifier si la candidate existe
        const [candidates] = await db.query('SELECT sexe FROM candidates WHERE id = ?', [candidate_id]);
        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate non trouvée' });
        }
        
        const sexe = candidates[0].sexe;
        
        // Pour les femmes, vérifier le test de grossesse
        let statut = 'VALIDE';
        if (sexe === 'F') {
            if (!test_grossesse || test_grossesse === '') {
                return res.status(400).json({ error: 'Le test de grossesse est obligatoire pour les femmes' });
            }
            
            if (test_grossesse === 'POSITIF') {
                statut = 'REJETE';
            }
        }
        
        // Vérifier l'aptitude physique
        if (apte_physiquement === false) {
            statut = 'REJETE';
        }
        
        // Vérifier les contre-indications majeures
        if (contre_indications && contre_indications.length > 0) {
            const ciMajeures = contre_indications.filter(ci => ci.niveau === 'MAJEURE');
            if (ciMajeures.length > 0) {
                statut = 'REJETE';
            }
        }
        
        // Calcul automatique Pignet si pas fourni
        let pignetValue = pignet;
        if (!pignetValue && taille && poids) {
            pignetValue = (taille - poids).toFixed(2);
        }

        const [result] = await db.query(`
            INSERT INTO visites_medicales (
                candidate_id, date_visite, ville_visite, medecin_nom, etablissement,
                taille, poids, imc, interpretation_imc, temperature,
                tension_arterielle, pouls, pignet,
                av, vision, audition, buccodentaire, bdc, peau,
                coeur_poumons, abdomen, membres_superieurs, membres_inferieurs,
                etat_general, asthmatique, handicap,
                test_grossesse, grossesse,
                groupe_sanguin, allergies, maladies_chroniques,
                examens, contre_indications, apte_physiquement, observations, statut, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            candidate_id, date_visite, ville_visite || null, medecin_nom, etablissement,
            taille || null, poids || null, imc, interpretation_imc, temperature || null,
            tension_arterielle || null, pouls || null, pignetValue || null,
            av || null, vision || null, audition || null, buccodentaire || null, bdc || null, peau || null,
            coeur_poumons || null, abdomen || null, membres_superieurs || null, membres_inferieurs || null,
            etat_general || null, asthmatique || false, handicap || false,
            test_grossesse || null, grossesse || false,
            groupe_sanguin || null, allergies || null, maladies_chroniques || null,
            JSON.stringify(examens || []), JSON.stringify(contre_indications || []),
            apte_physiquement, observations || '', statut, req.user.id
        ]);
        
        // Mettre à jour le statut de la candidate selon le résultat de la visite
        // Parcours: Sélectionné → Apte (si VALIDE) ou Inapte (si REJETE)
        if (statut === 'VALIDE') {
            await db.query('UPDATE candidates SET statut = ? WHERE id = ?', ['Apte', candidate_id]);
        } else {
            await db.query('UPDATE candidates SET statut = ? WHERE id = ?', ['Inapte', candidate_id]);
        }

        res.status(201).json({
            id: result.insertId,
            statut,
            message: statut === 'VALIDE'
                ? 'Visite médicale validée - Candidate apte (prête pour admission)'
                : 'Visite médicale rejetée - Candidate inapte'
        });
    } catch (error) {
        console.error('Error creating visite:', error.message);
        console.error('SQL Error Code:', error.code);
        console.error('SQL State:', error.sqlState);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
});

// PUT update visite
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const {
            date_visite, ville_visite, medecin_nom, etablissement,
            taille, poids, temperature, tension_arterielle, pouls, pignet,
            av, vision, audition, buccodentaire, bdc, peau,
            coeur_poumons, abdomen, membres_superieurs, membres_inferieurs,
            etat_general, asthmatique, handicap,
            test_grossesse, grossesse,
            groupe_sanguin, allergies, maladies_chroniques,
            examens, contre_indications, apte_physiquement, observations
        } = req.body;

        // Recalculer l'IMC si taille et poids sont fournis
        let imc = null;
        let interpretation_imc = null;
        let pignetValue = pignet;
        if (taille && poids) {
            const tailleEnMetres = taille / 100;
            imc = (poids / (tailleEnMetres * tailleEnMetres)).toFixed(2);
            pignetValue = (taille - poids).toFixed(2);

            if (imc < 18.5) {
                interpretation_imc = 'Maigreur';
            } else if (imc < 25) {
                interpretation_imc = 'Normal';
            } else if (imc < 30) {
                interpretation_imc = 'Surpoids';
            } else {
                interpretation_imc = 'Obésité';
            }
        }

        // Récupérer la visite actuelle
        const [visites] = await db.query(`
            SELECT vm.candidate_id, c.sexe
            FROM visites_medicales vm
            LEFT JOIN candidates c ON vm.candidate_id = c.id
            WHERE vm.id = ?
        `, [req.params.id]);

        if (visites.length === 0) {
            return res.status(404).json({ error: 'Visite non trouvée' });
        }

        const { candidate_id, sexe } = visites[0];

        // Recalculer le statut
        let statut = 'VALIDE';
        if (sexe === 'F' && test_grossesse === 'POSITIF') {
            statut = 'REJETE';
        }
        if (apte_physiquement === false) {
            statut = 'REJETE';
        }
        if (contre_indications && contre_indications.length > 0) {
            const ciMajeures = contre_indications.filter(ci => ci.niveau === 'MAJEURE');
            if (ciMajeures.length > 0) {
                statut = 'REJETE';
            }
        }

        await db.query(`
            UPDATE visites_medicales SET
                date_visite = ?, ville_visite = ?, medecin_nom = ?, etablissement = ?,
                taille = ?, poids = ?, imc = ?, interpretation_imc = ?,
                temperature = ?, tension_arterielle = ?, pouls = ?, pignet = ?,
                av = ?, vision = ?, audition = ?, buccodentaire = ?, bdc = ?, peau = ?,
                coeur_poumons = ?, abdomen = ?, membres_superieurs = ?, membres_inferieurs = ?,
                etat_general = ?, asthmatique = ?, handicap = ?,
                test_grossesse = ?, grossesse = ?,
                groupe_sanguin = ?, allergies = ?, maladies_chroniques = ?,
                examens = ?, contre_indications = ?, apte_physiquement = ?, observations = ?,
                statut = ?
            WHERE id = ?
        `, [
            date_visite, ville_visite || null, medecin_nom, etablissement,
            taille || null, poids || null, imc, interpretation_imc,
            temperature || null, tension_arterielle || null, pouls || null, pignetValue || null,
            av || null, vision || null, audition || null, buccodentaire || null, bdc || null, peau || null,
            coeur_poumons || null, abdomen || null, membres_superieurs || null, membres_inferieurs || null,
            etat_general || null, asthmatique || false, handicap || false,
            test_grossesse || null, grossesse || false,
            groupe_sanguin || null, allergies || null, maladies_chroniques || null,
            JSON.stringify(examens || []), JSON.stringify(contre_indications || []), apte_physiquement, observations || '',
            statut,
            req.params.id
        ]);
        
        // Mettre à jour le statut de la candidate selon le résultat de la visite
        // Parcours: Sélectionné → Apte (si VALIDE) ou Inapte (si REJETE)
        if (statut === 'VALIDE') {
            await db.query('UPDATE candidates SET statut = ? WHERE id = ?', ['Apte', candidate_id]);
        } else {
            await db.query('UPDATE candidates SET statut = ? WHERE id = ?', ['Inapte', candidate_id]);
        }

        res.json({
            message: 'Visite médicale mise à jour',
            statut,
            candidateStatut: statut === 'VALIDE' ? 'Apte' : 'Inapte'
        });
    } catch (error) {
        console.error('Error updating visite:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// DELETE visite (soft delete)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await db.query('UPDATE visites_medicales SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
        res.json({ message: 'Visite médicale supprimée' });
    } catch (error) {
        console.error('Error deleting visite:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
