const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const upload = require('../config/multer');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { validate, candidateSchemas } = require('../middleware/validationMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');
const { sendWelcomeEmail, sendStatusUpdateEmail } = require('../services/emailService');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// All routes require authentication
router.use(verifyToken);

let candidatesColumnsCache = null;
let candidatesColumnsPromise = null;

const isDev = () => process.env.NODE_ENV !== 'production';

const getCandidatesColumns = async () => {
    if (Array.isArray(candidatesColumnsCache)) return candidatesColumnsCache;
    if (candidatesColumnsPromise) return candidatesColumnsPromise;

    candidatesColumnsPromise = (async () => {
        const [columns] = await db.query('SHOW COLUMNS FROM candidates');
        candidatesColumnsCache = columns.map(c => c.Field);
        return candidatesColumnsCache;
    })().finally(() => {
        candidatesColumnsPromise = null;
    });

    return candidatesColumnsPromise;
};

// GET tous les candidates avec recherche multi-critères
router.get('/', async (req, res) => {
    try {
        const {
            search, region, ville, metier, diplome, type_document,
            statut, a_des_enfants, age_min, age_max, page = 1, limit = 10,
            projet_id, cohorte_id, centre_id, sexe
        } = req.query;

        const existingColumns = await getCandidatesColumns();
        const columnsSet = new Set(existingColumns);

        let query = `
            SELECT
                c.*,
                p.nom as projet_nom,
                coh.nom as cohorte_nom,
                cent.nom as centre_nom
            FROM candidates c
            LEFT JOIN projects p ON c.projet_id = p.id
            LEFT JOIN cohortes coh ON c.cohorte_id = coh.id
            LEFT JOIN centres cent ON c.centre_id = cent.id
            WHERE 1=1
        `;
        const params = [];

        // Recherche globale
        if (search) {
            const candidateSearchColumns = [
                'nom',
                'prenom',
                'telephone',
                'telephone_2',
                'email',
                'nni',
                'numero_document'
            ].filter(col => columnsSet.has(col));

            if (candidateSearchColumns.length > 0) {
                query += ` AND (${candidateSearchColumns.map(col => `c.${col} LIKE ?`).join(' OR ')})`;
                const searchParam = `%${search}%`;
                params.push(...candidateSearchColumns.map(() => searchParam));
            }
        }

        // Filtres spécifiques (préfixer avec c. pour éviter les ambiguïtés avec les JOINs)
        if (region && columnsSet.has('region')) { query += ' AND c.region = ?'; params.push(region); }
        if (ville && columnsSet.has('ville')) { query += ' AND c.ville = ?'; params.push(ville); }
        if (metier && columnsSet.has('metier_choisi')) { query += ' AND c.metier_choisi = ?'; params.push(metier); }
        if (diplome && columnsSet.has('diplome')) { query += ' AND c.diplome = ?'; params.push(diplome); }
        if (type_document && columnsSet.has('type_document')) { query += ' AND c.type_document = ?'; params.push(type_document); }
        if (statut && columnsSet.has('statut')) { query += ' AND c.statut = ?'; params.push(statut); }
        if (columnsSet.has('a_des_enfants') && a_des_enfants !== undefined && a_des_enfants !== '') {
            query += ' AND c.a_des_enfants = ?';
            params.push(a_des_enfants === 'true' ? 1 : 0);
        }
        if (age_min && columnsSet.has('age')) { query += ' AND c.age >= ?'; params.push(parseInt(age_min)); }
        if (age_max && columnsSet.has('age')) { query += ' AND c.age <= ?'; params.push(parseInt(age_max)); }
        if (projet_id && columnsSet.has('projet_id')) { query += ' AND c.projet_id = ?'; params.push(parseInt(projet_id)); }
        if (cohorte_id && columnsSet.has('cohorte_id')) { query += ' AND c.cohorte_id = ?'; params.push(parseInt(cohorte_id)); }
        if (centre_id && columnsSet.has('centre_id')) { query += ' AND c.centre_id = ?'; params.push(parseInt(centre_id)); }
        if (sexe && columnsSet.has('sexe')) { query += ' AND c.sexe = ?'; params.push(sexe); }

        // Compter le total - Construction propre de la requête COUNT
        const countQuery = `
            SELECT COUNT(*) as total
            FROM candidates c
            LEFT JOIN projects p ON c.projet_id = p.id
            LEFT JOIN cohortes coh ON c.cohorte_id = coh.id
            LEFT JOIN centres cent ON c.centre_id = cent.id
        ` + query.substring(query.indexOf('WHERE'));
        const [countResult] = await db.query(countQuery, params);
        const total = countResult && countResult[0] ? countResult[0].total : 0;

        // Pagination
        // Use c.id for ordering to avoid ambiguity with JOINs
        query += ' ORDER BY c.id DESC LIMIT ? OFFSET ?';
        const offset = (parseInt(page) - 1) * parseInt(limit);
        params.push(parseInt(limit), offset);

        const [candidates] = await db.query(query, params);

        res.json({
            data: candidates,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des candidates',
            ...(isDev() ? { details: error.message } : {})
        });
    }
});

// ============================================================
// EXPORT PDF - Fiche individuelle candidat
// ============================================================
router.get('/export/pdf/:id', async (req, res) => {
    try {
        const [candidates] = await db.query(`
            SELECT c.*,
                   p.nom as projet_nom, p.code as projet_code,
                   coh.nom as cohorte_nom, coh.code as cohorte_code,
                   cent.nom as centre_nom
            FROM candidates c
            LEFT JOIN projects p ON c.projet_id = p.id
            LEFT JOIN cohortes coh ON c.cohorte_id = coh.id
            LEFT JOIN centres cent ON c.centre_id = cent.id
            WHERE c.id = ?
        `, [req.params.id]);

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidat non trouve' });
        }

        const cand = candidates[0];

        // Recuperer enfants
        const [enfants] = await db.query('SELECT * FROM enfants WHERE candidate_id = ?', [cand.id]);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=fiche_candidat_${cand.id}.pdf`);
        doc.pipe(res);

        generateCandidatePDF(doc, cand, enfants);

        doc.end();
    } catch (error) {
        console.error('Error exporting candidate PDF:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur export PDF', details: error.message });
        }
    }
});

// ============================================================
// EXPORT PDF GROUPE - Liste de candidats filtree
// ============================================================
router.get('/export/pdf-group', async (req, res) => {
    try {
        const { ids, projet_id, cohorte_id, centre_id, statut, region, sexe } = req.query;

        let query = `
            SELECT c.*,
                   p.nom as projet_nom, p.code as projet_code,
                   coh.nom as cohorte_nom, coh.code as cohorte_code,
                   cent.nom as centre_nom
            FROM candidates c
            LEFT JOIN projects p ON c.projet_id = p.id
            LEFT JOIN cohortes coh ON c.cohorte_id = coh.id
            LEFT JOIN centres cent ON c.centre_id = cent.id
            WHERE 1=1
        `;
        const params = [];

        // Si des IDs specifiques sont fournis
        if (ids) {
            const idList = ids.split(',').map(Number).filter(n => !isNaN(n));
            if (idList.length > 0) {
                query += ` AND c.id IN (${idList.map(() => '?').join(',')})`;
                params.push(...idList);
            }
        }

        // Filtres
        if (projet_id) { query += ' AND c.projet_id = ?'; params.push(parseInt(projet_id)); }
        if (cohorte_id) { query += ' AND c.cohorte_id = ?'; params.push(parseInt(cohorte_id)); }
        if (centre_id) { query += ' AND c.centre_id = ?'; params.push(parseInt(centre_id)); }
        if (statut) { query += ' AND c.statut = ?'; params.push(statut); }
        if (region) { query += ' AND c.region = ?'; params.push(region); }
        if (sexe) { query += ' AND c.sexe = ?'; params.push(sexe); }

        query += ' ORDER BY c.nom ASC, c.prenom ASC LIMIT 200';

        const [candidates] = await db.query(query, params);

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Aucun candidat trouve' });
        }

        // Recuperer enfants pour chaque candidat
        const candidateIds = candidates.map(c => c.id);
        const [allEnfants] = await db.query(
            `SELECT * FROM enfants WHERE candidate_id IN (${candidateIds.map(() => '?').join(',')})`,
            candidateIds
        );

        const enfantsMap = {};
        allEnfants.forEach(e => {
            if (!enfantsMap[e.candidate_id]) enfantsMap[e.candidate_id] = [];
            enfantsMap[e.candidate_id].push(e);
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=fiches_candidats_${Date.now()}.pdf`);
        doc.pipe(res);

        // Generer une fiche par candidat (1 page par candidat)
        candidates.forEach((cand, index) => {
            if (index > 0) doc.addPage();
            generateCandidatePDF(doc, cand, enfantsMap[cand.id] || []);
        });

        doc.end();
    } catch (error) {
        console.error('Error exporting group PDF:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Erreur export PDF groupe', details: error.message });
        }
    }
});

// ============================================================
// Generateur PDF fiche candidat - style administratif portrait
// Polices lisibles : titres 11-14pt, labels 9pt, valeurs 10pt
// ============================================================
function generateCandidatePDF(doc, cand, enfants) {
    const M = 36;
    const pageW = 595.28;
    const W = pageW - M * 2;

    const C = {
        PRIMARY: '#1a2332',
        DARK: '#2d3748',
        LABEL: '#374151',
        BORDER: '#d1d5db',
        SECTION_BG: '#f9fafb',
        GREEN: '#166534',
        RED: '#991b1b',
        ACCENT: '#2563eb',
        LIGHT: '#f3f4f6'
    };

    const fillRect = (x, y, w, h, color) => {
        doc.save().rect(x, y, w, h).fill(color).restore();
    };
    const strokeRect = (x, y, w, h, color, lw) => {
        doc.save().lineWidth(lw || 0.5).rect(x, y, w, h).stroke(color).restore();
    };
    const fillStrokeRect = (x, y, w, h, fc, sc) => {
        doc.save().rect(x, y, w, h).fillAndStroke(fc, sc).restore();
    };
    const hLine = (x1, yl, x2, color, lw) => {
        doc.save().lineWidth(lw || 0.5).moveTo(x1, yl).lineTo(x2, yl).stroke(color).restore();
    };
    const vLine = (x, y1, y2, color, lw) => {
        doc.save().lineWidth(lw || 0.3).moveTo(x, y1).lineTo(x, y2).stroke(color).restore();
    };
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

    // Section header - police 10pt
    const sectionHead = (title, num, y) => {
        fillRect(M, y, W, 20, C.PRIMARY);
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
           .text(`${num}. ${title}`, M + 8, y + 5, { width: W - 16 });
        return y + 20;
    };

    // Champ label:valeur - label 9pt, valeur 10pt
    const field = (label, value, x, y, lw, vw) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(C.LABEL)
           .text(label, x, y, { width: lw || 95, lineBreak: false });
        doc.font('Helvetica').fontSize(10).fillColor('#000000')
           .text(String(value || '—'), x + (lw || 95), y, { width: vw || 155, lineBreak: false });
    };

    const projetNom = cand.projet_nom || 'Projet';
    const dossierId = `CAND-${new Date().getFullYear()}-${String(cand.id).padStart(5, '0')}`;
    const halfW = W / 2;
    const c1 = M + 10;
    const c2 = M + halfW + 10;
    const lw = 90;
    const vw = halfW - lw - 18;
    const rowH = 16; // hauteur entre lignes

    // ============================================================
    // EN-TETE
    // ============================================================
    let y = M;
    fillRect(M, y, W, 3, C.ACCENT);
    y += 6;

    doc.font('Helvetica-Bold').fontSize(15).fillColor(C.PRIMARY)
       .text(projetNom.toUpperCase(), M, y, { align: 'center', width: W });
    y += 22;

    fillRect(M, y, W, 26, C.PRIMARY);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff')
       .text('FICHE D\'INSCRIPTION DU CANDIDAT', M, y + 6, { align: 'center', width: W });
    doc.font('Helvetica').fontSize(8).fillColor('#ffffff')
       .text(`Ref: ${dossierId}`, M + W - 140, y + 9, { width: 130, align: 'right' });
    y += 28;

    // ============================================================
    // I. IDENTIFICATION + PHOTO
    // ============================================================
    const sec1Top = y;
    const sec1H = 110;
    strokeRect(M, sec1Top, W, sec1H, C.BORDER, 0.5);
    y = sectionHead('IDENTIFICATION', 'I', y);

    // Photo a droite
    const photoW = 72;
    const photoH = 80;
    const photoX = M + W - photoW - 10;
    const photoY = y + 4;

    let photoLoaded = false;
    if (cand.photo) {
        try {
            const photoPath = path.join(__dirname, '..', cand.photo.startsWith('/') ? cand.photo.substring(1) : cand.photo);
            if (fs.existsSync(photoPath)) {
                fillStrokeRect(photoX, photoY, photoW, photoH, '#f8f9fa', C.BORDER);
                doc.image(photoPath, photoX + 2, photoY + 2, {
                    width: photoW - 4, height: photoH - 4,
                    fit: [photoW - 4, photoH - 4], align: 'center', valign: 'center'
                });
                strokeRect(photoX, photoY, photoW, photoH, C.PRIMARY, 1);
                photoLoaded = true;
            }
        } catch (e) { /* photo non dispo */ }
    }
    if (!photoLoaded) {
        fillStrokeRect(photoX, photoY, photoW, photoH, '#f1f5f9', C.BORDER);
        doc.font('Helvetica').fontSize(9).fillColor('#94a3b8')
           .text('Photo', photoX, photoY + 30, { width: photoW, align: 'center' })
           .text('N/D', photoX, photoY + 42, { width: photoW, align: 'center' });
        strokeRect(photoX, photoY, photoW, photoH, C.BORDER, 0.8);
    }

    // Champs identite
    field('Nom :', cand.nom ? cand.nom.toUpperCase() : '—', c1, y + 5, lw, vw);
    field('Prenom(s) :', cand.prenom, c2 - 40, y + 5, lw, vw);
    field('Date naiss. :', fmtDate(cand.date_naissance), c1, y + 5 + rowH, lw, vw);
    field('Age :', cand.age ? `${cand.age} ans` : '—', c2 - 40, y + 5 + rowH, lw, vw);
    field('Sexe :', cand.sexe === 'F' ? 'Feminin' : cand.sexe === 'M' ? 'Masculin' : cand.sexe || '—', c1, y + 5 + rowH * 2, lw, vw);
    field('Sit. matrim. :', cand.situation_matrimoniale || '—', c2 - 40, y + 5 + rowH * 2, lw, vw);
    field(`${cand.type_document || 'Piece'} :`, cand.numero_document || '—', c1, y + 5 + rowH * 3, lw, vw);
    field('Nationalite :', cand.nationalite || '—', c2 - 40, y + 5 + rowH * 3, lw, vw);
    if (cand.nni) {
        field('NNI :', cand.nni, c1, y + 5 + rowH * 4, lw, vw);
    }

    // ============================================================
    // II. COORDONNEES
    // ============================================================
    y = sec1Top + sec1H + 3;
    const sec2H = 50;
    strokeRect(M, y, W, sec2H, C.BORDER, 0.5);
    y = sectionHead('COORDONNEES', 'II', y);

    vLine(M + halfW, y, y + 26, C.BORDER);
    field('Telephone :', cand.telephone || '—', c1, y + 4, lw, vw);
    field('Tel. 2 :', cand.telephone_2 || '—', c2, y + 4, lw, vw);
    field('Email :', cand.email || '—', c1, y + 4 + rowH, lw, vw + 50);
    field('Adresse :', cand.adresse || '—', c2, y + 4 + rowH, lw, vw);

    // ============================================================
    // III. LOCALISATION
    // ============================================================
    y = y - 20 + sec2H + 3;
    const sec3H = 38;
    strokeRect(M, y, W, sec3H, C.BORDER, 0.5);
    y = sectionHead('LOCALISATION', 'III', y);

    vLine(M + halfW, y, y + 14, C.BORDER);
    field('Region :', cand.region || '—', c1, y + 3, lw, vw);
    field('Ville :', cand.ville || '—', c2, y + 3, lw, vw);

    // ============================================================
    // IV. AFFECTATION PROGRAMME
    // ============================================================
    y = y - 20 + sec3H + 3;
    const sec4H = 54;
    strokeRect(M, y, W, sec4H, C.BORDER, 0.5);
    y = sectionHead('AFFECTATION PROGRAMME', 'IV', y);

    vLine(M + halfW, y, y + 28, C.BORDER);
    field('Projet :', projetNom, c1, y + 4, lw, vw + 30);
    field('Centre :', cand.centre_nom || '—', c2, y + 4, lw, vw);
    field('Cohorte :', cand.cohorte_nom || '—', c1, y + 4 + rowH, lw, vw);
    field('Metier choisi :', cand.metier_choisi || '—', c2, y + 4 + rowH, lw, vw);

    // ============================================================
    // V. FORMATION / DIPLOMES
    // ============================================================
    y = y - 20 + sec4H + 3;
    const sec5H = 38;
    strokeRect(M, y, W, sec5H, C.BORDER, 0.5);
    y = sectionHead('FORMATION ACADEMIQUE', 'V', y);

    vLine(M + halfW, y, y + 14, C.BORDER);
    field('Diplome :', cand.diplome || '—', c1, y + 3, lw, vw);
    field('Niveau :', cand.niveau_etude || '—', c2, y + 3, lw, vw);

    // ============================================================
    // VI. SITUATION FAMILIALE
    // ============================================================
    y = y - 20 + sec5H + 3;
    const hasEnfants = enfants && enfants.length > 0;
    const sec6H = hasEnfants ? 40 + Math.min(enfants.length, 4) * 16 + 18 : 40;
    strokeRect(M, y, W, sec6H, C.BORDER, 0.5);
    y = sectionHead('SITUATION FAMILIALE', 'VI', y);

    field('Enfants :', cand.a_des_enfants ? 'Oui' : 'Non', c1, y + 4, lw, 50);
    if (cand.nombre_enfants) {
        field('Nombre :', cand.nombre_enfants, M + 190, y + 4, 60, 50);
    }
    field('Enfants au centre :', cand.enfants_au_centre ? 'Oui' : 'Non', c2, y + 4, 110, 50);

    // Tableau enfants
    if (hasEnfants) {
        y += 22;
        const eCols = [
            { l: 'Prenom / Nom', w: 160 },
            { l: 'Sexe', w: 55 },
            { l: 'Age', w: 55 },
            { l: 'Date naiss.', w: 100 },
            { l: 'Au centre', w: 65 }
        ];
        let tx = M + 5;
        eCols.forEach(col => {
            fillStrokeRect(tx, y, col.w, 16, C.LIGHT, C.BORDER);
            doc.font('Helvetica-Bold').fontSize(8).fillColor(C.DARK)
               .text(col.l, tx + 4, y + 4, { width: col.w - 8 });
            tx += col.w;
        });
        y += 16;

        enfants.slice(0, 4).forEach(enf => {
            tx = M + 5;
            const vals = [
                `${enf.prenom || ''} ${enf.nom || ''}`.trim() || '—',
                enf.sexe || '—',
                enf.age ? `${enf.age} ans` : '—',
                fmtDate(enf.date_naissance),
                enf.au_centre ? 'Oui' : 'Non'
            ];
            eCols.forEach((col, i) => {
                strokeRect(tx, y, col.w, 16, C.BORDER);
                doc.font('Helvetica').fontSize(9).fillColor('#000')
                   .text(vals[i], tx + 4, y + 4, { width: col.w - 8 });
                tx += col.w;
            });
            y += 16;
        });
    }

    // ============================================================
    // VII. PERSONNE A CONTACTER EN CAS D'URGENCE
    // ============================================================
    y = y + (hasEnfants ? 5 : -20 + sec6H + 3);
    const sec7H = 38;
    strokeRect(M, y, W, sec7H, C.BORDER, 0.5);
    y = sectionHead('CONTACT D\'URGENCE', 'VII', y);

    vLine(M + halfW, y, y + 14, C.BORDER);
    field('Nom :', cand.urgence_nom || '—', c1, y + 3, lw, vw);
    field('Telephone :', cand.urgence_telephone || '—', c2, y + 3, lw, vw);

    // ============================================================
    // VIII. STATUT CANDIDATURE
    // ============================================================
    y = y - 20 + sec7H + 3;
    const sec8H = 40;
    strokeRect(M, y, W, sec8H, C.BORDER, 0.5);
    y = sectionHead('STATUT DE LA CANDIDATURE', 'VIII', y);

    // Badge statut
    const statutColors = {
        'Inscrit': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
        'Selectionne': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
        'Apte': { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
        'En formation': { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
        'Termine': { bg: '#f0fdf4', text: '#14532d', border: '#bbf7d0' },
        'Rejete': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        'Inapte': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        'Abandonne': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' }
    };
    const st = statutColors[cand.statut] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };

    fillStrokeRect(c1, y + 2, 110, 16, st.bg, st.border);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(st.text)
       .text(cand.statut || '—', c1 + 4, y + 5, { width: 102, align: 'center' });

    field('Date inscription :', fmtDate(cand.created_at), M + 140, y + 4, 105, 120);

    // ============================================================
    // PIED DE PAGE
    // ============================================================
    const footerY = 841.89 - M - 18;
    fillRect(M, footerY, W, 16, C.PRIMARY);
    doc.font('Helvetica').fontSize(8).fillColor('#ffffff')
       .text(`${projetNom}  |  Ref: ${dossierId}  |  Genere le ${fmtDate(new Date())}`, M + 8, footerY + 4, { width: W - 16, align: 'center' });
    fillRect(M, footerY + 16, W, 2, C.ACCENT);
}

// GET un candidate par ID avec ses enfants et affectation
router.get('/:id(\\d+)', async (req, res) => {
    try {
        // Requête avec JOINs pour récupérer les informations d'affectation
        const [candidates] = await db.query(`
            SELECT
                c.*,
                p.nom as projet_nom,
                p.code as projet_code,
                coh.nom as cohorte_nom,
                coh.code as cohorte_code,
                cent.nom as centre_nom
            FROM candidates c
            LEFT JOIN projects p ON c.projet_id = p.id
            LEFT JOIN cohortes coh ON c.cohorte_id = coh.id
            LEFT JOIN centres cent ON c.centre_id = cent.id
            WHERE c.id = ?
        `, [req.params.id]);

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate non trouvée' });
        }

        const candidate = candidates[0];

        // Récupérer les enfants
        const [enfants] = await db.query('SELECT * FROM enfants WHERE candidate_id = ?', [req.params.id]);
        candidate.enfants = enfants;

        // Récupérer les diplômes
        const [diplomes] = await db.query('SELECT * FROM candidate_diplomes WHERE candidate_id = ?', [req.params.id]);
        candidate.diplomes = diplomes;

        // Récupérer les fichiers
        const [fichiers] = await db.query('SELECT * FROM candidate_fichiers WHERE candidate_id = ?', [req.params.id]);
        candidate.fichiers = fichiers;

        res.json(candidate);
    } catch (error) {
        console.error('Error fetching candidate:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération de la candidate' });
    }
});

// POST Upload photo
router.post('/upload-photo/:id', (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer Photo Error:', err);
            return res.status(400).json({ error: `Erreur upload photo: ${err.message}` });
        } else if (err) {
            console.error('Photo Upload Error:', err);
            // Si l'erreur vient du filtre de fichiers (validation utilisateur), on renvoie 400
            if (err.message && err.message.includes('Type de fichier')) {
                return res.status(400).json({ error: err.message });
            }
            return res.status(500).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        const photoUrl = `/uploads/${req.file.filename}`;
        await db.query('UPDATE candidates SET photo = ? WHERE id = ?', [photoUrl, req.params.id]);

        res.json({
            message: 'Photo uploadée avec succès',
            photoUrl: photoUrl
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({ error: 'Erreur lors de l\'upload de la photo' });
    }
});

// POST Upload fichiers (multiple)
// POST Upload fichiers (multiple)
router.post('/upload-fichiers/:id', (req, res, next) => {
    upload.array('fichiers', 10)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error('Multer Error:', err);
            return res.status(400).json({ error: `Erreur upload: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error('Unknown Upload Error:', err);
            return res.status(400).json({ error: err.message });
        }
        // Everything went fine.
        next();
    });
}, async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        const fichiers = [];
        for (const file of req.files) {
            const cheminFichier = `/uploads/${file.filename}`;
            try {
                await db.query(
                    `INSERT INTO candidate_fichiers (candidate_id, nom_fichier, chemin_fichier, type_fichier, taille_fichier)
                     VALUES (?, ?, ?, ?, ?)`,
                    [req.params.id, file.originalname, cheminFichier, file.mimetype, file.size]
                );
                fichiers.push({
                    nom: file.originalname,
                    chemin: cheminFichier,
                    type: file.mimetype,
                    taille: file.size
                });
            } catch (dbError) {
                console.error('Database Error inserting file:', dbError);
                // Continue inserting other files even if one fails
            }
        }

        res.json({
            message: `${fichiers.length} fichier(s) uploadé(s) avec succès`,
            fichiers: fichiers
        });
    } catch (error) {
        console.error('Error in upload controller:', error);
        res.status(500).json({ error: 'Erreur lors du traitement des fichiers' });
    }
});

// POST créer un nouveau candidate (admin and gestionnaire only)
router.post('/', requireRole(['admin', 'gestionnaire']), validate(candidateSchemas.create), async (req, res) => {
    try {
        const {
            nom, prenom, date_naissance, age, lieu_naissance, sexe, telephone, telephone_2, email,
            region, region_chef_lieu, ville, quartier, repere_logement, adresse, prix_transport,
            type_document, numero_document, nni, date_validite_document, cmu, aej_numero,
            diplome, annee_diplome, niveau_etude, metier_choisi, activite_actuelle,
            revenu_mensuel, plus_grande_somme_gere,
            situation_matrimoniale, a_des_enfants, nombre_enfants, nombre_enfants_charge,
            enfants_au_centre, statut, photo, surnom,
            pere_nom, pere_profession, pere_contact1, pere_contact2, pere_vivant,
            mere_nom, mere_profession, mere_contact1, mere_contact2, mere_vivante,
            urgence_nom, urgence_affiliation, urgence_contact1, urgence_contact2, urgence_profession,
            enfants,
            projet_id, cohorte_id, centre_id
        } = req.body;

        const [result] = await db.query(
            `INSERT INTO candidates (
                nom, prenom, date_naissance, age, lieu_naissance, sexe, telephone, telephone_2, email,
                region, region_chef_lieu, ville, quartier, repere_logement, adresse, prix_transport,
                type_document, numero_document, nni, date_validite_document, cmu, aej_numero,
                diplome, annee_diplome, niveau_etude, metier_choisi, activite_actuelle,
                revenu_mensuel, plus_grande_somme_gere,
                situation_matrimoniale, a_des_enfants, nombre_enfants, nombre_enfants_charge,
                enfants_au_centre, statut, photo, surnom,
                pere_nom, pere_profession, pere_contact1, pere_contact2, pere_vivant,
                mere_nom, mere_profession, mere_contact1, mere_contact2, mere_vivante,
                urgence_nom, urgence_affiliation, urgence_contact1, urgence_contact2, urgence_profession,
                projet_id, cohorte_id, centre_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nom, prenom, date_naissance, age, lieu_naissance, sexe || 'F', telephone, telephone_2, email,
                region, region_chef_lieu, ville, quartier, repere_logement, adresse, prix_transport,
                type_document || 'Aucun document', numero_document, nni, date_validite_document, cmu, aej_numero,
                diplome || 'Sans diplôme', annee_diplome, niveau_etude, metier_choisi, activite_actuelle,
                revenu_mensuel, plus_grande_somme_gere,
                situation_matrimoniale, a_des_enfants || false, nombre_enfants || 0, nombre_enfants_charge || 0,
                enfants_au_centre || false, statut || 'Inscrit', photo || null, surnom,
                pere_nom, pere_profession, pere_contact1, pere_contact2, pere_vivant !== undefined ? pere_vivant : true,
                mere_nom, mere_profession, mere_contact1, mere_contact2, mere_vivante !== undefined ? mere_vivante : true,
                urgence_nom, urgence_affiliation, urgence_contact1, urgence_contact2, urgence_profession,
                projet_id || null, cohorte_id || null, centre_id || null
            ]
        );

        const candidateId = result.insertId;

        // Ajouter les enfants si présents
        if (enfants && Array.isArray(enfants) && enfants.length > 0) {
            for (const enfant of enfants) {
                await db.query(
                    `INSERT INTO enfants (candidate_id, nom, prenom, date_naissance, age, sexe, au_centre)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        candidateId, enfant.nom, enfant.prenom,
                        enfant.date_naissance, enfant.age, enfant.sexe,
                        enfant.au_centre || false
                    ]
                );
            }
        }

        // Ajouter les diplômes si présents (format: "diplome1,diplome2,diplome3")
        if (diplome && diplome !== 'Sans diplôme') {
            const diplomes = diplome.split(',').filter(d => d.trim());
            for (const dip of diplomes) {
                await db.query(
                    `INSERT INTO candidate_diplomes (candidate_id, diplome, annee_obtention)
                     VALUES (?, ?, ?)`,
                    [candidateId, dip.trim(), annee_diplome || null]
                );
            }
        }

        res.status(201).json({
            message: 'Candidate créée avec succès',
            id: candidateId
        });

        // Log audit (fire-and-forget to avoid crashing after response sent)
        logAudit(req.user.id, 'CREATE', 'candidate', candidateId, { data: req.body }, req)
            .catch(err => console.error('Audit log error:', err));

        // Send welcome email (fire-and-forget)
        sendWelcomeEmail({ ...req.body, id: candidateId }).catch(err => console.error('Email error:', err));

    } catch (error) {
        console.error('Error creating candidate:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la candidate' });
    }
});

// PUT mettre à jour un candidate (admin and gestionnaire only)
router.put('/:id(\\d+)', requireRole(['admin', 'gestionnaire']), validate(candidateSchemas.create), async (req, res) => {
    try {
        // Get existing candidate data for audit
        const [existingData] = await db.query('SELECT * FROM candidates WHERE id = ?', [req.params.id]);
        const existingCandidate = existingData[0];

        const {
            nom, prenom, date_naissance, age, lieu_naissance, sexe, telephone, telephone_2, email,
            region, region_chef_lieu, ville, quartier, repere_logement, adresse, prix_transport,
            type_document, numero_document, nni, date_validite_document, cmu, aej_numero,
            diplome, annee_diplome, niveau_etude, metier_choisi, activite_actuelle,
            revenu_mensuel, plus_grande_somme_gere,
            situation_matrimoniale, a_des_enfants, nombre_enfants, nombre_enfants_charge,
            enfants_au_centre, statut, photo, surnom,
            pere_nom, pere_profession, pere_contact1, pere_contact2, pere_vivant,
            mere_nom, mere_profession, mere_contact1, mere_contact2, mere_vivante,
            urgence_nom, urgence_affiliation, urgence_contact1, urgence_contact2, urgence_profession,
            enfants,
            projet_id, cohorte_id, centre_id
        } = req.body;

        await db.query(
            `UPDATE candidates SET
                nom = ?, prenom = ?, date_naissance = ?, age = ?, lieu_naissance = ?, sexe = ?, telephone = ?, telephone_2 = ?, email = ?,
                region = ?, region_chef_lieu = ?, ville = ?, quartier = ?, repere_logement = ?, adresse = ?, prix_transport = ?,
                type_document = ?, numero_document = ?, nni = ?, date_validite_document = ?, cmu = ?, aej_numero = ?,
                diplome = ?, annee_diplome = ?, niveau_etude = ?, metier_choisi = ?, activite_actuelle = ?,
                revenu_mensuel = ?, plus_grande_somme_gere = ?,
                situation_matrimoniale = ?, a_des_enfants = ?, nombre_enfants = ?, nombre_enfants_charge = ?,
                enfants_au_centre = ?, statut = ?, photo = ?, surnom = ?,
                pere_nom = ?, pere_profession = ?, pere_contact1 = ?, pere_contact2 = ?, pere_vivant = ?,
                mere_nom = ?, mere_profession = ?, mere_contact1 = ?, mere_contact2 = ?, mere_vivante = ?,
                urgence_nom = ?, urgence_affiliation = ?, urgence_contact1 = ?, urgence_contact2 = ?, urgence_profession = ?,
                projet_id = ?, cohorte_id = ?, centre_id = ?
            WHERE id = ?`,
            [
                nom, prenom, date_naissance, age, lieu_naissance, sexe, telephone, telephone_2, email,
                region, region_chef_lieu, ville, quartier, repere_logement, adresse, prix_transport,
                type_document, numero_document, nni, date_validite_document, cmu, aej_numero,
                diplome, annee_diplome, niveau_etude, metier_choisi, activite_actuelle,
                revenu_mensuel, plus_grande_somme_gere,
                situation_matrimoniale, a_des_enfants, nombre_enfants, nombre_enfants_charge,
                enfants_au_centre, statut, photo, surnom,
                pere_nom, pere_profession, pere_contact1, pere_contact2, pere_vivant,
                mere_nom, mere_profession, mere_contact1, mere_contact2, mere_vivante,
                urgence_nom, urgence_affiliation, urgence_contact1, urgence_contact2, urgence_profession,
                projet_id || null, cohorte_id || null, centre_id || null,
                req.params.id
            ]
        );

        // Mettre à jour les enfants
        if (enfants && Array.isArray(enfants)) {
            // Supprimer les anciens enfants
            await db.query('DELETE FROM enfants WHERE candidate_id = ?', [req.params.id]);

            // Ajouter les nouveaux
            for (const enfant of enfants) {
                await db.query(
                    `INSERT INTO enfants (candidate_id, nom, prenom, date_naissance, age, sexe, au_centre)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        req.params.id, enfant.nom, enfant.prenom,
                        enfant.date_naissance, enfant.age, enfant.sexe,
                        enfant.au_centre || false
                    ]
                );
            }
        }

        // Mettre à jour les diplômes
        await db.query('DELETE FROM candidate_diplomes WHERE candidate_id = ?', [req.params.id]);
        if (diplome && diplome !== 'Sans diplôme') {
            const diplomes = diplome.split(',').filter(d => d.trim());
            for (const dip of diplomes) {
                await db.query(
                    `INSERT INTO candidate_diplomes (candidate_id, diplome, annee_obtention)
                     VALUES (?, ?, ?)`,
                    [req.params.id, dip.trim(), annee_diplome || null]
                );
            }
        }

        res.json({ message: 'Candidate mise à jour avec succès' });

        // Log audit (fire-and-forget to avoid crashing after response sent)
        logAudit(req.user.id, 'UPDATE', 'candidate', req.params.id, {
            before: existingCandidate,
            after: req.body
        }, req).catch(err => console.error('Audit log error:', err));

        // Send notification if status changed (also fire-and-forget)
        if (req.body.statut && existingCandidate.statut !== req.body.statut) {
            sendStatusUpdateEmail(
                { ...existingCandidate, ...req.body },
                existingCandidate.statut,
                req.body.statut
            ).catch(err => console.error('Email error:', err));
        }
    } catch (error) {
        console.error('Error updating candidate:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la candidate' });
    }
});

// DELETE supprimer un candidate (admin and gestionnaire only)
router.delete('/:id(\\d+)', requireRole(['admin', 'gestionnaire']), async (req, res) => {
    try {
        // Get candidate data before deletion for audit
        const [candidateData] = await db.query('SELECT * FROM candidates WHERE id = ?', [req.params.id]);

        await db.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);
        res.json({ message: 'Candidate supprimée avec succès' });

        // Log audit
        if (candidateData.length > 0) {
            await logAudit(req.user.id, 'DELETE', 'candidate', req.params.id, {
                deleted: candidateData[0]
            }, req);
        }
    } catch (error) {
        console.error('Error deleting candidate:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la candidate' });
    }
});

// GET filtres disponibles (régions, villes, métiers, etc.)
router.get('/filters/options', async (req, res) => {
    try {
        const existingColumns = await getCandidatesColumns();
        const columnsSet = new Set(existingColumns);

        const regions = columnsSet.has('region')
            ? (await db.query('SELECT DISTINCT region FROM candidates ORDER BY region'))[0]
            : [];
        const villes = columnsSet.has('ville')
            ? (await db.query('SELECT DISTINCT ville FROM candidates ORDER BY ville'))[0]
            : [];
        const metiers = columnsSet.has('metier_choisi')
            ? (await db.query('SELECT DISTINCT metier_choisi FROM candidates WHERE metier_choisi IS NOT NULL ORDER BY metier_choisi'))[0]
            : [];
        const diplomes = columnsSet.has('diplome')
            ? (await db.query('SELECT DISTINCT diplome FROM candidates ORDER BY diplome'))[0]
            : [];
        const documents = columnsSet.has('type_document')
            ? (await db.query('SELECT DISTINCT type_document FROM candidates ORDER BY type_document'))[0]
            : [];

        res.json({
            regions: regions.map(r => r.region),
            villes: villes.map(v => v.ville),
            metiers: metiers.map(m => m.metier_choisi),
            diplomes: diplomes.map(d => d.diplome),
            documents: documents.map(d => d.type_document)
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des filtres',
            ...(isDev() ? { details: error.message } : {})
        });
    }
});

// GET preview file (with Word conversion support)
router.get('/preview/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        // Get file info from database
        const [files] = await db.query(
            'SELECT * FROM candidate_fichiers WHERE id = ?',
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }

        const file = files[0];
        const filePath = `.${file.chemin_fichier}`;
        const fs = require('fs');
        const path = require('path');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Fichier physique non trouvé' });
        }

        const ext = path.extname(file.nom_fichier).toLowerCase();

        // Handle Word documents (.doc, .docx)
        if (ext === '.docx' || ext === '.doc') {
            const mammoth = require('mammoth');

            try {
                const result = await mammoth.convertToHtml({ path: filePath });
                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                max-width: 800px;
                                margin: 20px auto;
                                padding: 20px;
                                line-height: 1.6;
                                color: #333;
                            }
                            h1, h2, h3 { color: #2c3e50; }
                            p { margin-bottom: 1em; }
                            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                            td, th { border: 1px solid #ddd; padding: 8px; }
                        </style>
                    </head>
                    <body>
                        ${result.value}
                    </body>
                    </html>
                `;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.send(html);
            } catch (conversionError) {
                console.error('Word conversion error:', conversionError);
                res.status(500).json({ error: 'Erreur lors de la conversion du document Word' });
            }
        }
        // Handle PDFs and images - serve directly
        else if (['.pdf', '.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            res.sendFile(path.resolve(filePath));
        }
        // Other file types - download
        else {
            res.download(filePath, file.nom_fichier);
        }

    } catch (error) {
        console.error('Error previewing file:', error);
        res.status(500).json({ error: 'Erreur lors de la prévisualisation du fichier' });
    }
});

// PUT validate candidate (Sélectionner/Rejeter)
// Parcours: Inscrit → Sélectionné (pour visite médicale) ou Rejeté
router.put('/:id(\\d+)/validate', requireRole(['admin', 'gestionnaire']), async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, comment } = req.body;

        // Nouveaux statuts selon le parcours
        // Sélectionné = critères OK, prêt pour visite médicale
        // Rejeté = critères non remplis
        const validDecisions = ['Sélectionné', 'Rejeté'];
        if (!decision || !validDecisions.includes(decision)) {
            return res.status(400).json({ error: 'Décision invalide. Utilisez "Sélectionné" ou "Rejeté"' });
        }

        if (!comment || comment.trim().length < 5) {
            return res.status(400).json({ error: 'Un commentaire est requis (minimum 5 caractères)' });
        }

        // Get candidate info
        const [candidates] = await db.query('SELECT * FROM candidates WHERE id = ?', [id]);

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate non trouvée' });
        }

        const candidate = candidates[0];

        // Vérifier que le candidat est bien au statut "Inscrit"
        if (candidate.statut !== 'Inscrit') {
            return res.status(400).json({
                error: `Impossible de valider. Le candidat doit être au statut "Inscrit" (statut actuel: ${candidate.statut})`
            });
        }

        // Update candidate status
        await db.query(
            'UPDATE candidates SET statut = ?, updated_at = NOW() WHERE id = ?',
            [decision, id]
        );

        // Log the decision in audit
        await logAudit(
            req.user.id,
            'VALIDATE',
            'candidate',
            id,
            {
                before: { statut: candidate.statut },
                after: { statut: decision },
                comment: comment,
                validatedBy: req.user.email
            },
            req
        );

        res.json({
            success: true,
            message: decision === 'Sélectionné'
                ? 'Candidat sélectionné pour la visite médicale'
                : 'Candidature rejetée',
            data: {
                id,
                statut: decision,
                comment,
                validatedBy: req.user.email,
                validatedAt: new Date(),
                nextStep: decision === 'Sélectionné' ? 'Visite médicale' : null
            }
        });

    } catch (error) {
        console.error('Error validating candidate:', error);
        res.status(500).json({ error: 'Erreur lors de la validation de la candidature' });
    }
});

// PUT admettre un candidat (Apte → Admis)
router.put('/:id(\\d+)/admettre', requireRole(['admin', 'gestionnaire']), async (req, res) => {
    try {
        const { id } = req.params;

        const [candidates] = await db.query('SELECT * FROM candidates WHERE id = ?', [id]);

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate non trouvée' });
        }

        const candidate = candidates[0];

        // Vérifier que le candidat est "Apte"
        if (candidate.statut !== 'Apte') {
            return res.status(400).json({
                error: `Seuls les candidats "Apte" peuvent être admis (statut actuel: ${candidate.statut})`
            });
        }

        await db.query(
            'UPDATE candidates SET statut = ?, updated_at = NOW() WHERE id = ?',
            ['Admis', id]
        );

        await logAudit(
            req.user.id,
            'ADMIT',
            'candidate',
            id,
            {
                before: { statut: 'Apte' },
                after: { statut: 'Admis' },
                admittedBy: req.user.email
            },
            req
        );

        res.json({
            success: true,
            message: 'Candidat admis en formation',
            data: { id, statut: 'Admis' }
        });

    } catch (error) {
        console.error('Error admitting candidate:', error);
        res.status(500).json({ error: 'Erreur lors de l\'admission du candidat' });
    }
});

// PUT réhabiliter un candidat rejeté (Rejeté → Inscrit)
router.put('/:id(\\d+)/rehabiliter', requireRole(['admin', 'gestionnaire']), async (req, res) => {
    try {
        const { id } = req.params;
        const { motif } = req.body;

        if (!motif || motif.trim().length < 5) {
            return res.status(400).json({ error: 'Un motif de réhabilitation est requis (minimum 5 caractères)' });
        }

        const [candidates] = await db.query('SELECT * FROM candidates WHERE id = ?', [id]);
        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate non trouvée' });
        }

        const candidate = candidates[0];
        if (candidate.statut !== 'Rejeté') {
            return res.status(400).json({
                error: `Seuls les candidats "Rejeté" peuvent être réhabilités (statut actuel: ${candidate.statut})`
            });
        }

        await db.query(
            'UPDATE candidates SET statut = ?, updated_at = NOW() WHERE id = ?',
            ['Inscrit', id]
        );

        await logAudit(
            req.user.id,
            'REHABILITATE',
            'candidate',
            id,
            {
                before: { statut: 'Rejeté' },
                after: { statut: 'Inscrit' },
                motif: motif,
                rehabilitatedBy: req.user.email
            },
            req
        );

        res.json({
            success: true,
            message: 'Candidat réhabilité avec succès',
            data: { id, statut: 'Inscrit', motif }
        });
    } catch (error) {
        console.error('Error rehabilitating candidate:', error);
        res.status(500).json({ error: 'Erreur lors de la réhabilitation' });
    }
});

module.exports = router;
