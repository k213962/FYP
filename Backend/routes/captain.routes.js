const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../middlewares/auth.middleware');
const CaptainController = require('../controllers/captain.controller');
const PasswordResetController = require('../controllers/passwordReset.controller');

const router = express.Router();

// REGISTER
router.post('/register', [
    // Name validation
    body('fullname.firstname')
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2 }).withMessage('First name must be at least 2 characters')
        .matches(/^[A-Za-z\s]+$/).withMessage('First name can only contain letters and spaces'),
    
    body('fullname.lastname')
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters')
        .matches(/^[A-Za-z\s]+$/).withMessage('Last name can only contain letters and spaces'),
    
    // Email validation
    body('email')
        .isEmail().withMessage('Valid email is required')
        .normalizeEmail(),
    
    // Password validation
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/)
        .withMessage('Password must contain at least one uppercase letter, one number, and one special character'),
    
    // CNIC validation
    body('cnic')
        .notEmpty().withMessage('CNIC is required')
        .isLength({ min: 13, max: 13 }).withMessage('CNIC must be exactly 13 digits')
        .matches(/^[0-9]+$/).withMessage('CNIC must contain only numbers'),
    
    // Mobile validation
    body('mobile')
        .notEmpty().withMessage('Mobile number is required')
        .matches(/^03[0-9]{9}$/).withMessage('Mobile number must start with 03 and be 11 digits'),
    
    // Driver License validation
    body('driverLicense')
        .notEmpty().withMessage('Driver license is required')
        .isLength({ min: 5 }).withMessage('Driver license must be at least 5 characters')
        .matches(/^[A-Za-z0-9-]+$/).withMessage('Driver license can only contain letters, numbers, and hyphens'),
    
    // Vehicle Plate validation
    body('vehiclePlateNo')
        .notEmpty().withMessage('Vehicle plate number is required')
        .matches(/^[A-Z]{3}-[0-9]{3,4}$/).withMessage('Vehicle plate must be in format ABC-123 or ABC-1234'),
    
    // Vehicle Type validation
    body('vehicleType')
        .notEmpty().withMessage('Vehicle type is required')
        .isIn(['ambulance', 'fire', 'police']).withMessage('Invalid vehicle type')
], CaptainController.registerCaptain);

// LOGIN
router.post('/login', CaptainController.loginCaptain);

// LOGOUT
router.post('/logout', auth, CaptainController.logoutCaptain);

// GET PROFILE
router.get('/profile', auth, CaptainController.getCaptainProfile);

// Update Captain Status
router.patch('/status', auth, CaptainController.updateStatus);

// Update Captain Stats
router.patch('/stats', auth, CaptainController.updateStats);

// Update location
router.post('/location', auth, CaptainController.updateLocation);

// Forgot Password
router.post('/forgot-password', PasswordResetController.initiatePasswordReset);

// Reset Password
router.post('/reset-password', PasswordResetController.resetPassword);

// Location update routes
router.get('/location', auth, CaptainController.getLocation);

module.exports = router; 