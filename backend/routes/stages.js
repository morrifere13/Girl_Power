const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const stagesController = require('../controllers/stagesController');

// Appliquer l'authentification à toutes les routes
router.use(verifyToken);

// Routes CRUD
router.get('/', stagesController.getAll);
router.get('/:id', stagesController.getById);
router.post('/', stagesController.create);
router.put('/:id', stagesController.update);
router.delete('/:id', stagesController.delete);

// Routes spécifiques - Doivent être avant /:id pour éviter les conflits
router.post('/:id/evaluer', stagesController.addEvaluation);
router.get('/:id/evaluations', stagesController.getEvaluations);
router.put('/:id/statut', stagesController.updateStatut);

// Routes de recherche
router.get('/candidate/:candidateId', stagesController.getByCandidateId);
router.get('/entreprise/:entrepriseId', stagesController.getByEntrepriseId);

module.exports = router;
