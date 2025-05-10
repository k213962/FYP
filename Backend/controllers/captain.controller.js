const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Captain = require("../models/captain.model");
const BlacklistToken = require("../models/blacklistToken.model");

// Register Captain
exports.registerCaptain = async (req, res) => {
<<<<<<< HEAD
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

        // Create new captain
        const captain = new Captain({
            fullname,
            email,
            password: hashedPassword,
            cnic,
            phone: formattedPhone,
            driverLicense,
            vehicleNoPlate: vehiclePlateNo,
            vehicleType: vehicleType.toLowerCase()
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
=======
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    fullname: { firstname, lastname },
    email,
    password,
    cnic,
    mobile,
    driverLicense,
    vehicle: { plate, type }
  } = req.body;

  try {
    const existing = await Captain.findOne({
      $or: [
        { email },
        { cnic },
        { mobile },
        { driverLicense },
        { "vehicle.plate": plate }
      ]
    });

    if (existing) {
      const messages = [];
      if (existing.email === email) messages.push("Email already exists");
      if (existing.cnic === cnic) messages.push("CNIC already exists");
      if (existing.mobile === mobile) messages.push("Mobile already exists");
      if (existing.driverLicense === driverLicense) messages.push("Driver License already exists");
      if (existing.vehicle.plate === plate) messages.push("Vehicle Plate already exists");
      return res.status(400).json({ message: messages });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const captain = new Captain({
      fullname: { firstname, lastname },
      email,
      password: hashedPassword,
      cnic,
      mobile,
      driverLicense,
      vehicle: { plate, type }
    });

    await captain.save();
    res.status(201).json({ message: "Captain registered successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
>>>>>>> 0fb847e (User Work Done)
};

// Login Captain
exports.loginCaptain = async (req, res) => {
  const { email, password } = req.body;

<<<<<<< HEAD
    try {
        const captain = await Captain.findOne({ email });
        if (!captain) return res.status(400).json({ message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, captain.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });
=======
  try {
    const captain = await Captain.findOne({ email });
    if (!captain) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, captain.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
>>>>>>> 0fb847e (User Work Done)

    const token = jwt.sign({ id: captain._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

<<<<<<< HEAD
        res.json({ token });

    } catch (err) {
        console.error("Error during login:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
=======
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
>>>>>>> 0fb847e (User Work Done)
};

// Logout Captain
exports.logoutCaptain = async (req, res) => {
<<<<<<< HEAD
    try {
        const token = req.header("Authorization").split(" ")[1];
        await BlacklistToken.create({ token });

        res.json({ message: "Logged out successfully" });

    } catch (err) {
        console.error("Error during logout:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
=======
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    await BlacklistToken.create({ token });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
>>>>>>> 0fb847e (User Work Done)
};

// Get Profile
exports.getCaptainProfile = async (req, res) => {
  try {
    const captain = await Captain.findById(req.user.id).select("-password");
    if (!captain) return res.status(404).json({ message: "Captain not found" });

<<<<<<< HEAD
        res.json(captain);

    } catch (err) {
        console.error("Error fetching profile:", err.message);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
=======
    res.json(captain);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
>>>>>>> 0fb847e (User Work Done)
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

// Update Captain Status
exports.updateStatus = async (req, res) => {
<<<<<<< HEAD
    try {
        const { status } = req.body;
        if (!['Online', 'Offline'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const captain = await Captain.findByIdAndUpdate(
            req.user.id,
            { status },
            { new: true }
        ).select('-password');

        if (!captain) {
            return res.status(404).json({ message: "Captain not found" });
        }

        res.status(200).json(captain);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
=======
  const { status } = req.body;
  if (!['Online', 'Offline'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const captain = await Captain.findByIdAndUpdate(
      req.user.id,
      { status },
      { new: true }
    ).select('-password');

    if (!captain) return res.status(404).json({ message: "Captain not found" });

    res.status(200).json(captain);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
>>>>>>> 0fb847e (User Work Done)
};

// Update Captain Stats
exports.updateStats = async (req, res) => {
<<<<<<< HEAD
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
=======
  const { hoursOnline } = req.body;

  try {
    const captain = await Captain.findByIdAndUpdate(
      req.user.id,
      { hoursOnline },
      { new: true }
    ).select('-password');

    if (!captain) return res.status(404).json({ message: "Captain not found" });

    res.status(200).json(captain);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
>>>>>>> 0fb847e (User Work Done)
