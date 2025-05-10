const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log('Authenticated User:', req.user); // Check the user in the request
        console.log('Request Body:', req.body); // Check the request body

        const { destination, vehicleType } = req.body;  // Get from body
        const userId = req.user.id;  // Get from token (auth)

        // Check if destination, vehicleType, or userId is missing
        if (!destination || !vehicleType || !userId) {
            console.error('Missing required fields');
            return res.status(400).json({ error: 'User, destination, and vehicle type are required' });
        }

        // Pass the parameters correctly to the service
        const ride = await rideService.createRide(userId, destination, vehicleType);

        if (!ride) {
            return res.status(400).json({ error: 'Failed to create ride' });
        }

        return res.status(201).json({ message: 'Ride created successfully', ride });

    } catch (error) {
        console.error('Error creating ride:', error.message);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
