const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Captain = require("../models/captain.model");
const BlacklistToken = require("../models/blacklistToken.model");

// Register Captain
exports.registerCaptain = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, cnic, mobile, driverLicense, vehiclePlateNo, vehicleType } = req.body;

    try {
        // Check for existing captain
        const existingCaptain = await Captain.findOne({ $or: [{ email }, { cnic }, { mobile }] });
        if (existingCaptain) {
            const errorMessages = [];
            if (existingCaptain.email === email) errorMessages.push("Captain with this email already exists");
            if (existingCaptain.cnic === cnic) errorMessages.push("CNIC already exists");
            if (existingCaptain.mobile === mobile) errorMessages.push("Mobile number already exists");
            return res.status(400).json({ message: errorMessages });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new captain
        const captain = new Captain({
            fullname,
            email,
            password: hashedPassword,
            cnic,
            mobile,
            driverLicense,
            vehiclePlateNo,
            vehicleType
        });

        await captain.save();
        res.status(201).json({ message: "Captain registered successfully" });

    } catch (err) {
        console.error("Error during registration:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Login Captain
exports.loginCaptain = async (req, res) => {
    const { email, password } = req.body;

    try {
        const captain = await Captain.findOne({ email });
        if (!captain) return res.status(400).json({ message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, captain.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        const token = jwt.sign({ id: captain._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token });

    } catch (err) {
        console.error("Error during login:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Logout Captain
exports.logoutCaptain = async (req, res) => {
    try {
        const token = req.header("Authorization").split(" ")[1];
        await BlacklistToken.create({ token });

        res.json({ message: "Logged out successfully" });

    } catch (err) {
        console.error("Error during logout:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Get Profile
exports.getCaptainProfile = async (req, res) => {
    try {
        const captain = await Captain.findById(req.user.id).select("-password");
        if (!captain) return res.status(404).json({ message: "Captain not found" });

        res.json(captain);

    } catch (err) {
        console.error("Error fetching profile:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};