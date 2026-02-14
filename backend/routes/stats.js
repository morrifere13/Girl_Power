const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

const isDev = () => process.env.NODE_ENV !== 'production';

let tableColumnsCache = null;
let tableColumnsPromise = null;

const getTableColumns = async (tableName) => {
    if (!tableColumnsCache) tableColumnsCache = new Map();
    if (tableColumnsCache.has(tableName)) return tableColumnsCache.get(tableName);

    if (!tableColumnsPromise) tableColumnsPromise = new Map();
    if (tableColumnsPromise.has(tableName)) return tableColumnsPromise.get(tableName);

    const p = (async () => {
        const [columns] = await db.query(`SHOW COLUMNS FROM \`${tableName}\``);
        const list = columns.map(c => c.Field);
        tableColumnsCache.set(tableName, list);
        return list;
    })().finally(() => {
        tableColumnsPromise.delete(tableName);
    });

    tableColumnsPromise.set(tableName, p);
    return p;
};

const tableExists = async (tableName) => {
    const [rows] = await db.query('SHOW TABLES LIKE ?', [tableName]);
    return Array.isArray(rows) && rows.length > 0;
};

// GET statistiques générales du tableau de bord
router.get('/dashboard', async (req, res) => {
    try {
        const candidatesExists = await tableExists('candidates');
        const enfantsExists = await tableExists('enfants');

        const candidatesColumns = candidatesExists ? await getTableColumns('candidates') : [];
        const enfantsColumns = enfantsExists ? await getTableColumns('enfants') : [];

        const candidatesSet = new Set(candidatesColumns);
        const enfantsSet = new Set(enfantsColumns);

        // Nombre total de candidates
        const [totalCandidates] = candidatesExists
            ? await db.query('SELECT COUNT(*) as total FROM candidates')
            : [[{ total: 0 }]];

        // Nombre de régions
        const [totalRegions] = (candidatesExists && candidatesSet.has('region'))
            ? await db.query('SELECT COUNT(DISTINCT region) as total FROM candidates')
            : [[{ total: 0 }]];

        // Nombre de villes
        const [totalVilles] = (candidatesExists && candidatesSet.has('ville'))
            ? await db.query('SELECT COUNT(DISTINCT ville) as total FROM candidates')
            : [[{ total: 0 }]];

        // Candidates avec enfants
        const [avecEnfants] = (candidatesExists && candidatesSet.has('a_des_enfants'))
            ? await db.query('SELECT COUNT(*) as total FROM candidates WHERE a_des_enfants = 1')
            : [[{ total: 0 }]];

        // Enfants au centre
        const [enfantsAuCentre] = (enfantsExists && enfantsSet.has('au_centre'))
            ? await db.query('SELECT COUNT(*) as total FROM enfants WHERE au_centre = 1')
            : [[{ total: 0 }]];

        // Mères au centre
        const [meresAuCentre] = (enfantsExists && enfantsSet.has('au_centre') && enfantsSet.has('candidate_id'))
            ? await db.query('SELECT COUNT(DISTINCT candidate_id) as total FROM enfants WHERE au_centre = 1')
            : [[{ total: 0 }]];

        // TOP 5 Régions
        const [top5Regions] = (candidatesExists && candidatesSet.has('region'))
            ? await db.query(`
                SELECT region, COUNT(*) as nombre
                FROM candidates
                GROUP BY region
                ORDER BY nombre DESC
                LIMIT 5
            `)
            : [[]];

        // TOP 5 Villes
        const [top5Villes] = (candidatesExists && candidatesSet.has('ville'))
            ? await db.query(`
                SELECT ville, COUNT(*) as nombre
                FROM candidates
                GROUP BY ville
                ORDER BY nombre DESC
                LIMIT 5
            `)
            : [[]];

        // TOP 5 Métiers
        const [top5Metiers] = (candidatesExists && candidatesSet.has('metier_choisi'))
            ? await db.query(`
                SELECT metier_choisi, COUNT(*) as nombre
                FROM candidates
                WHERE metier_choisi IS NOT NULL
                GROUP BY metier_choisi
                ORDER BY nombre DESC
                LIMIT 5
            `)
            : [[]];

        // Répartition par diplôme
        const [repartitionDiplomes] = (candidatesExists && candidatesSet.has('diplome'))
            ? await db.query(`
                SELECT diplome, COUNT(*) as nombre
                FROM candidates
                GROUP BY diplome
                ORDER BY nombre DESC
            `)
            : [[]];

        // Répartition par situation matrimoniale
        const [repartitionMatrimoniale] = (candidatesExists && candidatesSet.has('situation_matrimoniale'))
            ? await db.query(`
                SELECT situation_matrimoniale, COUNT(*) as nombre
                FROM candidates
                WHERE situation_matrimoniale IS NOT NULL
                GROUP BY situation_matrimoniale
                ORDER BY nombre DESC
            `)
            : [[]];

        // Répartition par niveau d'étude
        const [repartitionNiveauEtude] = (candidatesExists && candidatesSet.has('niveau_etude'))
            ? await db.query(`
                SELECT niveau_etude, COUNT(*) as nombre
                FROM candidates
                WHERE niveau_etude IS NOT NULL
                GROUP BY niveau_etude
                ORDER BY nombre DESC
            `)
            : [[]];

        // Répartition par type de document
        const [repartitionDocuments] = (candidatesExists && candidatesSet.has('type_document'))
            ? await db.query(`
                SELECT type_document, COUNT(*) as nombre
                FROM candidates
                GROUP BY type_document
                ORDER BY nombre DESC
            `)
            : [[]];

        // Répartition par région
        const [repartitionRegions] = (candidatesExists && candidatesSet.has('region'))
            ? await db.query(`
                SELECT region, COUNT(*) as nombre
                FROM candidates
                GROUP BY region
                ORDER BY nombre DESC
            `)
            : [[]];

        // Répartition par ville
        const [repartitionVilles] = (candidatesExists && candidatesSet.has('ville'))
            ? await db.query(`
                SELECT ville, COUNT(*) as nombre
                FROM candidates
                GROUP BY ville
                ORDER BY nombre DESC
            `)
            : [[]];

        // Répartition par métier
        const [repartitionMetiers] = (candidatesExists && candidatesSet.has('metier_choisi'))
            ? await db.query(`
                SELECT metier_choisi, COUNT(*) as nombre
                FROM candidates
                WHERE metier_choisi IS NOT NULL
                GROUP BY metier_choisi
                ORDER BY nombre DESC
            `)
            : [[]];

        // Statistiques d'âge des candidates
        const [ageStats] = (candidatesExists && candidatesSet.has('age'))
            ? await db.query(`
                SELECT
                    MIN(age) as age_min,
                    MAX(age) as age_max,
                    AVG(age) as age_moyen
                FROM candidates
            `)
            : [[{ age_min: null, age_max: null, age_moyen: null }]];

        // Répartition par tranche d'âge des candidates
        const [tranchesAge] = (candidatesExists && candidatesSet.has('age'))
            ? await db.query(`
                SELECT
                    CASE
                        WHEN age <= 20 THEN '15-20 ans'
                        WHEN age <= 25 THEN '21-25 ans'
                        WHEN age <= 30 THEN '26-30 ans'
                        ELSE '31+ ans'
                    END as tranche,
                    COUNT(*) as nombre
                FROM candidates
                GROUP BY tranche
                ORDER BY
                    CASE
                        WHEN age <= 20 THEN 1
                        WHEN age <= 25 THEN 2
                        WHEN age <= 30 THEN 3
                        ELSE 4
                    END
            `)
            : [[]];

        // Statistiques enfants
        const [enfantsStats] = (enfantsExists && enfantsSet.has('age'))
            ? await db.query(`
                SELECT
                    MIN(age) as age_min,
                    MAX(age) as age_max,
                    AVG(age) as age_moyen,
                    COUNT(*) as total
                FROM enfants
            `)
            : [[{ age_min: null, age_max: null, age_moyen: null, total: 0 }]];

        // Répartition enfants par sexe
        const [enfantsParSexe] = (enfantsExists && enfantsSet.has('sexe'))
            ? await db.query(`
                SELECT sexe, COUNT(*) as nombre
                FROM enfants
                GROUP BY sexe
            `)
            : [[]];

        // Répartition enfants par tranche d'âge
        const [enfantsTranchesAge] = (enfantsExists && enfantsSet.has('age'))
            ? await db.query(`
                SELECT
                    CASE
                        WHEN age <= 2 THEN '0-2 ans'
                        WHEN age <= 5 THEN '3-5 ans'
                        ELSE '6+ ans'
                    END as tranche,
                    COUNT(*) as nombre
                FROM enfants
                GROUP BY tranche
                ORDER BY
                    CASE
                        WHEN age <= 2 THEN 1
                        WHEN age <= 5 THEN 2
                        ELSE 3
                    END
            `)
            : [[]];

        // Nombre total d'enfants
        const [totalEnfants] = (candidatesExists && candidatesSet.has('nombre_enfants'))
            ? await db.query('SELECT SUM(nombre_enfants) as total FROM candidates')
            : [[{ total: 0 }]];

        // Statistiques détaillées enfants par sexe
        const [enfantsStatsSexe] = (enfantsExists && enfantsSet.has('sexe') && enfantsSet.has('age'))
            ? await db.query(`
                SELECT
                    sexe,
                    MIN(age) as age_min,
                    MAX(age) as age_max,
                    AVG(age) as age_moyen,
                    COUNT(*) as nombre
                FROM enfants
                GROUP BY sexe
            `)
            : [[]];

        res.json({
            resume: {
                total_candidates: totalCandidates[0].total,
                total_regions: totalRegions[0].total,
                total_villes: totalVilles[0].total,
                avec_enfants: avecEnfants[0].total,
                enfants_au_centre: enfantsAuCentre[0].total,
                meres_au_centre: meresAuCentre[0].total,
                total_enfants: totalEnfants[0].total || 0
            },
            top5: {
                regions: top5Regions,
                villes: top5Villes,
                metiers: top5Metiers
            },
            repartitions: {
                diplomes: repartitionDiplomes,
                documents: repartitionDocuments,
                regions: repartitionRegions,
                villes: repartitionVilles,
                regions: repartitionRegions,
                villes: repartitionVilles,
                metiers: repartitionMetiers,
                situation_matrimoniale: repartitionMatrimoniale,
                niveau_etude: repartitionNiveauEtude
            },
            age_candidates: {
                statistiques: ageStats[0],
                tranches: tranchesAge
            },
            age_enfants: {
                statistiques: enfantsStats[0],
                tranches: enfantsTranchesAge,
                par_sexe: enfantsParSexe,
                stats_par_sexe: enfantsStatsSexe
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des statistiques',
            ...(isDev() ? { details: error.message } : {})
        });
    }
});

// GET statistiques par région
router.get('/region/:region', async (req, res) => {
    try {
        const { region } = req.params;

        const [total] = await db.query('SELECT COUNT(*) as total FROM candidates WHERE region = ?', [region]);
        const [villes] = await db.query(`
            SELECT ville, COUNT(*) as nombre
            FROM candidates
            WHERE region = ?
            GROUP BY ville
            ORDER BY nombre DESC
        `, [region]);

        res.json({
            region,
            total: total[0].total,
            villes
        });
    } catch (error) {
        console.error('Error fetching region stats:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques régionales' });
    }
});

// GET statistiques par ville
router.get('/ville/:ville', async (req, res) => {
    try {
        const { ville } = req.params;

        const [total] = await db.query('SELECT COUNT(*) as total FROM candidates WHERE ville = ?', [ville]);
        const [metiers] = await db.query(`
            SELECT metier_choisi, COUNT(*) as nombre
            FROM candidates
            WHERE ville = ? AND metier_choisi IS NOT NULL
            GROUP BY metier_choisi
            ORDER BY nombre DESC
        `, [ville]);

        res.json({
            ville,
            total: total[0].total,
            metiers
        });
    } catch (error) {
        console.error('Error fetching ville stats:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des statistiques par ville' });
    }
});

module.exports = router;
