const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const BlacklistToken = require('../models/blacklistToken.model');
const { auth } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');
const passwordResetController = require('../controllers/passwordReset.controller');
const { body } = require('express-validator');
const router = express.Router();

// Public routes
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
        .matches(/^03[0-9]{9}$/).withMessage('Mobile number must start with 03 and be 11 digits')
], userController.registerUser);

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// GET PROFILE
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// LOGOUT
router.post('/logout', auth, async (req, res) => {
    try {
        const token = req.header('Authorization').split(" ")[1];

        await new BlacklistToken({ token }).save();

        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// Password Reset Routes
router.post('/forgot-password', passwordResetController.initiatePasswordReset);
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router;
