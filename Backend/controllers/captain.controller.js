const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Captain = require("../models/captain.model");
const BlacklistToken = require("../models/blacklistToken.model");
const captainService = require('../services/captain.service');

// Register Captain
exports.registerCaptain = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, cnic, mobile, driverLicense, vehiclePlateNo, vehicleType } = req.body;

    try {
        console.log("Received registration data:", {
            email,
            cnic,
            mobile,
            driverLicense,
            vehiclePlateNo,
            vehicleType
        });
        
        // Format mobile number to ensure consistency
        const formattedPhone = mobile.startsWith('03') ? mobile : `03${mobile}`;
        console.log("Formatted phone number:", formattedPhone);

        // Check for existing captain with the same phone number
        const existingPhone = await Captain.findOne({ phone: formattedPhone });
        console.log("Existing phone check result:", existingPhone);

        if (existingPhone) {
            console.log("Phone number already exists in database");
            return res.status(400).json({ message: ["Phone number already exists"] });
        }

        // Check for other existing fields
        const existingCaptain = await Captain.findOne({ 
            $or: [
                { email }, 
                { cnic }, 
                { vehicleNoPlate: vehiclePlateNo },
                { driverLicense }
            ] 
        });
        
        console.log("Existing captain check result:", existingCaptain);
        
        if (existingCaptain) {
            const errorMessages = [];
            if (existingCaptain.email === email) errorMessages.push("Email already exists");
            if (existingCaptain.cnic === cnic) errorMessages.push("CNIC already exists");
            if (existingCaptain.vehicleNoPlate === vehiclePlateNo) errorMessages.push("Vehicle plate number already exists");
            if (existingCaptain.driverLicense === driverLicense) errorMessages.push("Driver license already exists");
            console.log("Found existing captain with errors:", errorMessages);
            return res.status(400).json({ message: errorMessages });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new captain with default location
        const captain = new Captain({
            fullname,
            email,
            password: hashedPassword,
            cnic,
            phone: formattedPhone,
            driverLicense,
            vehicleNoPlate: vehiclePlateNo,
            vehicleType: vehicleType.toLowerCase(),
            status: 'Offline',
            location: {
                type: 'Point',
                coordinates: [0, 0],
                lastUpdated: new Date()
            }
        });

        console.log("Attempting to save new captain:", {
            email: captain.email,
            phone: captain.phone,
            vehicleNoPlate: captain.vehicleNoPlate
        });

        await captain.save();
        console.log("Captain saved successfully");
        res.status(201).json({ message: "Captain registered successfully" });

    } catch (err) {
        console.error("Error during registration:", err);
        console.error("Error details:", {
            message: err.message,
            code: err.code,
            keyPattern: err.keyPattern,
            keyValue: err.keyValue
        });
        
        if (err.code === 11000) {
            // Handle duplicate key error
            const field = Object.keys(err.keyPattern)[0];
            console.log("Duplicate key error on field:", field);
            return res.status(400).json({ 
                message: [`${field} already exists`]
            });
        }
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

        res.json({ 
            token,
            captain: {
                id: captain._id,
                fullname: captain.fullname,
                email: captain.email,
                status: captain.status
            }
        });

    } catch (err) {
        console.error("Error during login:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Update Captain Status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const captainId = req.user.id;

        const captain = await captainService.updateCaptainStatus(captainId, status);

        res.status(200).json({
            message: "Status updated successfully",
            captain: {
                id: captain._id,
                status: captain.status
            }
        });

    } catch (error) {
        console.error("Error updating status:", error.message);
        res.status(400).json({ message: error.message });
    }
};

// Update Captain Location
exports.updateLocation = async (req, res) => {
    try {
        const captainId = req.user.id;
        const { location } = req.body;

        const updatedCaptain = await captainService.updateCaptainLocation(captainId, location);

        return res.status(200).json({
            message: 'Location updated successfully',
            location: updatedCaptain.location
        });
    } catch (error) {
        console.error('Error updating location:', error.message);
        return res.status(400).json({ error: error.message });
    }
};

// Get Captain Location
exports.getLocation = async (req, res) => {
    try {
        const captainId = req.user.id;
        const location = await captainService.getCaptainLocation(captainId);
        return res.status(200).json({ location });
    } catch (error) {
        console.error('Error getting location:', error.message);
        return res.status(400).json({ error: error.message });
    }
};

// Logout Captain
exports.logoutCaptain = async (req, res) => {
    try {
        const token = req.header("Authorization").split(" ")[1];
        await BlacklistToken.create({ token });

        // Set status to Offline on logout
        const captain = await Captain.findById(req.user.id);
        if (captain) {
            captain.status = 'Offline';
            await captain.save();
        }

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

// Get Captain Profile
exports.getProfile = async (req, res) => {
    try {
        const captain = await Captain.findById(req.user.id).select('-password');
        if (!captain) {
            return res.status(404).json({ message: "Captain not found" });
        }
        res.status(200).json(captain);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update Captain Stats
exports.updateStats = async (req, res) => {
    try {
        const { hoursOnline } = req.body;
        const updateData = {};

        if (hoursOnline !== undefined) updateData.hoursOnline = hoursOnline;

        const captain = await Captain.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!captain) {
            return res.status(404).json({ message: "Captain not found" });
        }

        res.status(200).json(captain);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Start Location Tracking
exports.startLocationTracking = async (req, res) => {
    try {
        const captainId = req.user.id;
        const { location } = req.body;

        const result = await captainService.startLocationTracking(captainId, location);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error starting location tracking:', error.message);
        return res.status(400).json({ error: error.message });
    }
};

// Get Online Captains
exports.getOnlineCaptains = async (req, res) => {
    try {
        const onlineCaptains = await captainService.getOnlineCaptains();
        return res.status(200).json({ captains: onlineCaptains });
    } catch (error) {
        console.error('Error getting online captains:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

// Validate All Captain Locations
exports.validateAllLocations = async (req, res) => {
    try {
        const results = await captainService.validateAllCaptainLocations();
        
        // Log the results
        console.log('Location validation results:', {
            total: results.total,
            valid: results.valid,
            fixed: results.fixed,
            invalid: results.invalid
        });

        // Log details of fixed and invalid locations
        results.details.forEach(detail => {
            if (detail.status !== 'valid') {
                console.log('Location issue:', {
                    captainId: detail.captainId,
                    email: detail.email,
                    status: detail.status,
                    message: detail.message,
                    originalLocation: detail.originalLocation,
                    fixedCoordinates: detail.fixedCoordinates
                });
            }
        });

        res.status(200).json({
            message: 'Location validation completed',
            results
        });
    } catch (error) {
        console.error('Error validating locations:', error);
        res.status(500).json({ 
            message: 'Error validating locations',
            error: error.message 
        });
    }
};