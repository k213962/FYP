const express = require('express');
const { body } = require('express-validator');
const auth = require('../middlewares/auth.middleware');
const CaptainController = require('../controllers/captain.controller');

const router = express.Router();

// REGISTER
router.post('/register', [
    body('fullname.firstname').notEmpty().withMessage('First name is required'),
    body('fullname.lastname').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('cnic').notEmpty().withMessage('CNIC is required'),
    body('mobile').notEmpty().withMessage('Mobile number is required'),
    body('driverLicense').notEmpty().withMessage('Driver license is required'),
    body('vehiclePlateNo').notEmpty().withMessage('Vehicle plate number is required'),
    body('vehicleType').notEmpty().withMessage('Vehicle type is required')
], CaptainController.registerCaptain);

// LOGIN
router.post('/login', CaptainController.loginCaptain);

// LOGOUT
router.post('/logout', auth, CaptainController.logoutCaptain);

// GET PROFILE
router.get('/profile', auth, CaptainController.getCaptainProfile);

module.exports = router;