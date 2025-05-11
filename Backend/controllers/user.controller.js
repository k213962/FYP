const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/user.model");
const BlacklistToken = require("../models/blacklistToken.model");

// Register User
exports.registerUser = async (req, res) => {
    console.log("Registering user..."); // Debugging
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation Errors:", errors.array()); // Debugging
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, cnic, mobile } = req.body;
    console.log("Request Body:", req.body); // Debugging
    try {
        console.log("Checking if user already exists..."); // Debugging
        let user = await User.findOne({ email });
        if (user) {
            console.log("User with this email already exists."); // Debugging
            return res.status(400).json({ message: "User already exists" });
        }

        user = await User.findOne({ cnic });
        if (user) {
            console.log("User with this CNIC already exists."); // Debugging
            return res.status(400).json({ message: "CNIC already exists" });
        }

        user = await User.findOne({ mobile });
        if (user) {
            console.log("User with this mobile number already exists."); // Debugging
            return res.status(400).json({ message: "Mobile number already exists" });
        }

        console.log("Hashing password..."); // Debugging
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log("Creating new user..."); // Debugging
        user = new User({
            fullname: {
                firstname: fullname.firstname,
                lastname: fullname.lastname
            },
            email,
            password: hashedPassword,
            cnic,
            mobile
        });

        // Save the user to the database
        await user.save();
        console.log("User saved to the database."); // Debugging

        // Generate a token
        console.log("Generating token..."); // Debugging
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log("Generated Token:", token); // Debugging

        // Include the token in the response
        res.status(201).json({
            message: "User registered successfully",
            token: token // Ensure the token is explicitly included
        });

    } catch (err) {
        console.error("Error:", err.message); // Debugging
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Send both token and user data (excluding password)
        const userData = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            cnic: user.cnic,
            mobile: user.mobile
        };

        res.json({ token, user: userData });

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Logout User
exports.logoutUser = async (req, res) => {
    try {
        const token = req.header("Authorization").split(" ")[1];
        await BlacklistToken.create({ token });

        res.json({ message: "Logged out successfully" });

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
