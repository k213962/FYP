const express = require('express');
const router = express.Router();
const rideController = require('../controllers/ride.controller');
const { auth } = require('../middlewares/auth.middleware');

// Create new ride
router.post('/create', auth, rideController.createRide);

// Accept ride
router.post('/:rideId/accept', auth, rideController.acceptRide);

// Start ride
router.post('/:rideId/start', auth, rideController.startRide);

module.exports = router; 