const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/user.model");
const BlacklistToken = require("../models/blacklistToken.model");

// Register User
exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, cnic, mobile } = req.body;

    try {
        // Check for existing user using static methods
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { cnic },
                { mobile }
            ]
        });

        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ message: "Email already registered" });
            }
            if (existingUser.cnic === cnic) {
                return res.status(400).json({ message: "CNIC already registered" });
            }
            if (existingUser.mobile === mobile) {
                return res.status(400).json({ message: "Mobile number already registered" });
            }
        }

        // Create new user
        const user = new User({
            fullname: {
                firstname: fullname.firstname,
                lastname: fullname.lastname
            },
            email: email.toLowerCase(),
            password,
            cnic,
            mobile
        });

        await user.save();

        // Generate token with more secure options
        const token = jwt.sign(
            { 
                id: user._id,
                email: user.email
            }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: "1h",
                algorithm: "HS256"
            }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email
            }
        });

    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                message: "Validation Error", 
                errors: Object.values(err.errors).map(e => e.message)
            });
        }
        res.status(500).json({ message: "Server Error" });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Log request details (excluding password)
        console.log('Login attempt:', { email, passwordLength: password?.length });

        // Validate JWT secret
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured');
            throw new Error('JWT_SECRET is not configured');
        }

        // Find user and explicitly select password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            console.log('Account locked:', email);
            return res.status(403).json({ 
                message: "Account is locked. Try again later.",
                lockUntil: user.lockUntil
            });
        }

        // Compare password with better error handling
        let isMatch;
        try {
            isMatch = await user.comparePassword(password);
            console.log('Password comparison result:', isMatch);
        } catch (error) {
            console.error('Password comparison error:', error);
            return res.status(500).json({ 
                message: "Error during password verification",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        if (!isMatch) {
            console.log('Invalid password for user:', email);
            // Increment failed login attempts
            await user.incrementLoginAttempts();
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Reset login attempts on successful login
        await user.resetLoginAttempts();
        user.lastLogin = new Date();
        await user.save();

        // Generate token with error handling
        let token;
        try {
            token = jwt.sign(
                { 
                    id: user._id,
                    email: user.email
                }, 
                process.env.JWT_SECRET, 
                { 
                    expiresIn: "1h",
                    algorithm: "HS256"
                }
            );
            console.log('Token generated successfully for user:', email);
        } catch (error) {
            console.error('Token generation error:', error);
            return res.status(500).json({ 
                message: "Error generating authentication token",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }

        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            cnic: user.cnic,
            mobile: user.mobile,
            lastLogin: user.lastLogin
        };

        console.log('Login successful for user:', email);
        res.json({ 
            token, 
            user: userData,
            expiresIn: 3600 // Token expiration in seconds
        });

    } catch (err) {
        console.error('Login error:', {
            message: err.message,
            stack: err.stack,
            email: email
        });
        res.status(500).json({ 
            message: "Server Error",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Logout User
exports.logoutUser = async (req, res) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }

        // Add token to blacklist with expiration
        await BlacklistToken.create({ 
            token,
            expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
        });

        res.json({ message: "Logged out successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password -resetOTP -resetOTPExpiry");
            
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated" });
        }

        res.json({
            user,
            lastLogin: user.lastLogin
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
};
