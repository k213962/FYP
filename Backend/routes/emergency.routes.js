const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergency.controller');
const { authenticateToken } = require('../middleware/auth');

// Create new emergency
router.post('/', authenticateToken, emergencyController.createEmergency);

// Get emergency by ID
router.get('/:id', authenticateToken, emergencyController.getEmergencyById);

// Update emergency status
router.patch('/:id/status', authenticateToken, emergencyController.updateEmergencyStatus);

// Get emergencies by user ID
router.get('/user/:userId', authenticateToken, emergencyController.getEmergenciesByUserId);

// Get active emergencies
router.get('/active/all', authenticateToken, emergencyController.getActiveEmergencies);

module.exports = router; 