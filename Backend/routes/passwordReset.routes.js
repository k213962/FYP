const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordReset.controller');

// Initiate password reset
router.post('/forgot-password', passwordResetController.initiatePasswordReset);

// Reset password with OTP
router.post('/reset-password', passwordResetController.resetPassword);

module.exports = router; 