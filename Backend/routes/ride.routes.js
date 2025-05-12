const express = require('express');
const router = express.Router();
const RideController = require('../controllers/ride.controller');
const { auth } = require('../middlewares/auth.middleware');

// Create a new ride
router.post('/create', auth, RideController.createRide);

module.exports = router; 