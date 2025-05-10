const express= require('express');
const router= express.Router();
const {body}= require('express-validator');
const rideController= require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/create',
    authMiddleware,
    body('destination').notEmpty().withMessage('Dropoff location is required'),
    body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
    rideController.createRide
);
module.exports= router;