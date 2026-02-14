const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const entreprisesController = require('../controllers/entreprisesController');

// Appliquer l'authentification à toutes les routes
router.use(verifyToken);

// Routes CRUD
router.get('/', entreprisesController.getAll);
router.get('/:id', entreprisesController.getById);
router.post('/', entreprisesController.create);
router.put('/:id', entreprisesController.update);
router.delete('/:id', entreprisesController.delete);

// Routes spécifiques
router.get('/:id/stages', entreprisesController.getStages);
router.get('/:id/statistiques', entreprisesController.getStatistiques);

// Recherche par secteur (doit être avant /:id pour éviter les conflits)
router.get('/secteur/:secteur', entreprisesController.getBySecteur);

module.exports = router;
