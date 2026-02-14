const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation échouée',
                details: errors
            });
        }

        next();
    };
};

// Auth schemas
const authSchemas = {
    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Email invalide',
            'any.required': 'Email requis'
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Mot de passe trop court (min 6 caractères)',
            'any.required': 'Mot de passe requis'
        })
    }),

    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
            'string.pattern.base': 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
        }),
        nom: Joi.string().min(2).max(100).required(),
        prenom: Joi.string().min(2).max(100).required(),
        role: Joi.string().valid('admin', 'gestionnaire', 'consultant').default('consultant')
    }),

    changePassword: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    })
};

// Candidate schemas
const candidateSchemas = {
    create: Joi.object({
        nom: Joi.string().min(2).max(100).required(),
        prenom: Joi.string().min(2).max(100).required(),
        surnom: Joi.string().max(100).allow('', null),
        date_naissance: Joi.date().max('now').required(),
        age: Joi.number().integer().min(15).max(65),
        lieu_naissance: Joi.string().max(255).allow('', null),
        sexe: Joi.string().valid('F', 'M').default('F'),

        // Contact
        telephone: Joi.string().pattern(/^\d{8,10}$/).required().messages({
            'string.pattern.base': 'Numéro de téléphone invalide (8-10 chiffres)'
        }),
        telephone_2: Joi.string().pattern(/^\d{8,10}$/).allow('', null),
        email: Joi.string().email().allow('', null),

        // Location
        region: Joi.string().max(100).allow('', null),
        region_chef_lieu: Joi.string().max(100).allow('', null),
        ville: Joi.string().max(100).required(),
        quartier: Joi.string().max(100).allow('', null),
        repere_logement: Joi.string().max(500).allow('', null),
        adresse: Joi.string().max(500).allow('', null),
        prix_transport: Joi.number().integer().min(0).allow(null),

        // Parents
        pere_vivant: Joi.boolean().default(true),
        pere_nom: Joi.string().max(255).allow('', null),
        pere_profession: Joi.string().max(255).allow('', null),
        pere_contact1: Joi.string().pattern(/^\d{8,10}$/).allow('', null),
        pere_contact2: Joi.string().pattern(/^\d{8,10}$/).allow('', null),

        mere_vivante: Joi.boolean().default(true),
        mere_nom: Joi.string().max(255).allow('', null),
        mere_profession: Joi.string().max(255).allow('', null),
        mere_contact1: Joi.string().pattern(/^\d{8,10}$/).allow('', null),
        mere_contact2: Joi.string().pattern(/^\d{8,10}$/).allow('', null),

        // Emergency
        urgence_nom: Joi.string().max(255).allow('', null),
        urgence_affiliation: Joi.string().max(100).allow('', null),
        urgence_profession: Joi.string().max(255).allow('', null),
        urgence_contact1: Joi.string().pattern(/^\d{8,10}$/).required(),
        urgence_contact2: Joi.string().pattern(/^\d{8,10}$/).allow('', null),

        // Education & Career
        niveau_etude: Joi.string().max(255).allow('', null),
        diplome: Joi.string().max(500).allow('', null),
        annee_diplome: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
        metier_choisi: Joi.string().max(255).required(),
        activite_actuelle: Joi.string().max(255).allow('', null),
        revenu_mensuel: Joi.number().integer().min(0).allow(null),
        plus_grande_somme_gere: Joi.number().integer().min(0).allow(null),

        // Family
        situation_matrimoniale: Joi.string().valid('Célibataire', 'Mariée', 'Veuve', 'Divorcée', 'En couple').default('Célibataire'),
        a_des_enfants: Joi.boolean().default(false),
        nombre_enfants: Joi.number().integer().min(0).default(0),
        nombre_enfants_charge: Joi.number().integer().min(0).default(0),
        enfants_au_centre: Joi.boolean().default(false),

        // Documents
        type_document: Joi.string().max(100).allow('', null),
        numero_document: Joi.string().max(100).allow('', null),
        date_validite_document: Joi.date().allow('', null),
        nni: Joi.string().max(50).allow('', null),
        cmu: Joi.string().max(50).allow('', null),
        aej_numero: Joi.string().max(50).allow('', null),

        // Status & Other
        statut: Joi.string().valid('En attente', 'Acceptée', 'Refusée', 'En formation', 'VALIDEE', 'REFUSEE', 'Validée', 'En formation', 'Diplômée').default('En attente'),
        photo: Joi.string().max(500).allow('', null),

        // Affectation (Projet → Cohorte → Centre)
        projet_id: Joi.number().integer().positive().allow(null),
        cohorte_id: Joi.number().integer().positive().allow(null),
        centre_id: Joi.number().integer().positive().allow(null),

        // Children array
        enfants: Joi.array().items(Joi.object({
            id: Joi.number().optional(),
            candidate_id: Joi.number().optional(),
            nom: Joi.string().max(100).allow('', null),
            prenom: Joi.string().max(100).allow('', null),
            date_naissance: Joi.date().allow('', null),
            age: Joi.number().integer().min(0).max(25).allow(null),
            sexe: Joi.string().valid('M', 'F').allow('', null),
            au_centre: Joi.boolean().default(false)
        }).unknown(true)).default([])
    }).unknown(true)
};

module.exports = {
    validate,
    authSchemas,
    candidateSchemas
};
