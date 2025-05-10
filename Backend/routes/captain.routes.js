const express = require('express');
const { body } = require('express-validator');
const auth = require('../middlewares/auth.middleware');
const CaptainController = require('../controllers/captain.controller');

const router = express.Router();

// REGISTER CAPTAIN
router.post('/register', [
<<<<<<< HEAD
    body('fullname.firstname').notEmpty().withMessage('First name is required'),
    body('fullname.lastname').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('cnic').notEmpty().withMessage('CNIC is required'),
    body('mobile').notEmpty().withMessage('Mobile number is required'),
    body('driverLicense').notEmpty().withMessage('Driver license is required'),
    body('vehiclePlateNo').notEmpty().withMessage('Vehicle plate number is required'),
    body('vehicleType').notEmpty().withMessage('Vehicle type is required')
=======
  body('fullname.firstname').notEmpty().withMessage('First name is required'),
  body('fullname.lastname').notEmpty().withMessage('Last name is required'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .matches(/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com)$/)
    .withMessage('Email must be a valid Gmail or Hotmail address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('cnic')
    .matches(/^\d{13}$/)
    .withMessage('CNIC must be 13 digits (e.g., 4212345678901)'),
  body('mobile')
    .matches(/^(\+92|03)\d{9}$/)
    .withMessage('Mobile must be +923XXXXXXXXX or 03XXXXXXXXX'),
  body('driverLicense')
    .matches(/^[A-Z]{1}\d{7}$/)
    .withMessage('Driver license must be in format L1234567'),
  body('vehicle.plate')
    .matches(/^[A-Z]{1,3}-\d{3}$/)
    .withMessage('Vehicle plate must be like A-010, AB-010, or ABC-010'),
  body('vehicle.type')
    .isIn(['ambulance', 'fire-brigade', 'police'])
    .withMessage('Vehicle type must be either ambulance, fire-brigade, or police')
>>>>>>> 0fb847e (User Work Done)
], CaptainController.registerCaptain);

// LOGIN CAPTAIN
router.post('/login', CaptainController.loginCaptain);

// LOGOUT CAPTAIN
router.post('/logout', auth, CaptainController.logoutCaptain);

<<<<<<< HEAD
// GET PROFILE
router.get('/profile', auth, CaptainController.getProfile);

// Update Captain Status
router.patch('/status', auth, CaptainController.updateStatus);

// Update Captain Stats
router.patch('/stats', auth, CaptainController.updateStats);

module.exports = router;
=======
// GET CAPTAIN PROFILE
router.get('/profile', auth, CaptainController.getCaptainProfile);

// UPDATE STATUS (Online / Offline)
router.patch('/status', auth, CaptainController.updateStatus);

// UPDATE HOURS ONLINE (Stats)
router.patch('/stats', auth, CaptainController.updateStats);

module.exports = router;
>>>>>>> 0fb847e (User Work Done)
