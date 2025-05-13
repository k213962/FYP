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
        console.log('Login attempt for email:', email);
        console.log('Password received:', password ? 'Password provided' : 'No password provided');
        console.log('Password length:', password ? password.length : 0);

        // Check if email and password are provided
        if (!email || !password) {
            console.log('Missing credentials:', { email: !!email, password: !!password });
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        console.log('Stored password hash:', user.password);
        console.log('Attempting password comparison...');
        const isMatch = await user.comparePassword(password);
        console.log('Password match result:', isMatch);
        console.log('Password comparison details:', {
            providedPasswordLength: password.length,
            storedHashLength: user.password.length,
            isMatch: isMatch
        });

        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log('Token generated successfully');

        // Get user data without password
        const userData = await User.findById(user._id).select('-password');
        console.log('User data retrieved successfully');

        console.log('Login successful for user:', email);
        res.status(200).json({ 
            message: "Login successful", 
            token,
            userData 
        });
    } catch (error) {
        console.error("Login error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            response: error.response?.data
        });
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
