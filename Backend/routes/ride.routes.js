const express = require('express');
const router = express.Router();
const rideController = require('../controllers/ride.controller');
const { auth } = require('../middlewares/auth.middleware');

// Create new ride
router.post('/create', auth, rideController.createRide);

// Get ride status updates for a user
router.get('/status-updates', auth, rideController.getRideStatusUpdates);

// Polling endpoint for checking ride requests
router.get('/check-requests', auth, rideController.checkForRideRequests);

// Get nearby drivers for a ride
router.get('/:rideId/drivers', auth, rideController.findNearbyDrivers);

// Accept a ride (captain)
router.post('/:rideId/accept', auth, rideController.acceptRide);

// Start ride
router.post('/:rideId/start', auth, rideController.startRide);

// Get ride by ID - This must be the last route with a parameter to avoid conflicts
router.get('/:rideId', auth, rideController.getRideById);

module.exports = router; 