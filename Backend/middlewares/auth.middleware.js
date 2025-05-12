const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Captain = require('../models/captain.model');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No authentication token, access denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check token expiration
        if (Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({ 
                success: false,
                message: 'Token has expired' 
            });
        }

        // Find user or captain
        const user = await User.findOne({ _id: decoded.id });
        const captain = await Captain.findOne({ _id: decoded.id });

        if (!user && !captain) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Add user/captain info to request
        req.user = user || captain;
        req.token = token;
        
        // Add role-based access
        req.userRole = user ? 'user' : 'captain';
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Authentication failed' 
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied: insufficient permissions' 
            });
        }
        next();
    };
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: { 
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes' 
    }
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { 
        success: false,
        message: 'Too many requests, please try again later' 
    }
});

module.exports = {
    auth,
    authorize,
    loginLimiter,
    apiLimiter
};