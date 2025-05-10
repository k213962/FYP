const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const BlacklistToken = require('../models/blacklistToken.model');
const auth = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');
const router = express.Router();

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes
router.use(auth);
router.get('/profile', userController.getProfile);
router.post('/logout', userController.logoutUser);

module.exports = router;
