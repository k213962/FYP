const express = require('express');
const router = express.Router();
const rideController = require('../controllers/ride.controller');
const { auth } = require('../middlewares/auth.middleware');

// Create new ride
router.post('/create', auth, rideController.createRide);

// Get nearby drivers for a ride
router.get('/:rideId/drivers', auth, rideController.findNearbyDrivers);

// Accept ride
router.post('/:rideId/accept', auth, rideController.acceptRide);

// Start ride
router.post('/:rideId/start', auth, rideController.startRide);

// Get ride status updates for a user
router.get('/status-updates', auth, rideController.getRideStatusUpdates);

module.exports = router; 