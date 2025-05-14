const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');

// Simplified to store only ride status updates
const rideStatusUpdates = new Map();

const RideController = {
    createRide: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { emergencyLocation, serviceType, emergencyType, description } = req.body;
            const userId = req.user.id;

            // Create emergency request
            const ride = await rideService.createRide(userId, {
                emergencyLocation,
                serviceType,
                emergencyType,
                description
            });

            // Find nearby drivers 
            const nearbyDrivers = await rideService.findNearbyDrivers(
                emergencyLocation,
                serviceType,
                emergencyType
            );
            
            console.log(`\n🚗 Found ${nearbyDrivers.length} nearby drivers for ride ${ride._id}`);
            if (nearbyDrivers.length === 0) {
                console.log(`No drivers found for ride ${ride._id}`);
                // Store notification about no drivers
                storeRideStatusUpdate(userId, {
                    type: 'no_drivers',
                    rideId: ride._id,
                    message: "No available drivers found for your request.",
                    timestamp: new Date()
                });
            } else {
                console.log(`Available drivers: ${nearbyDrivers.map(d => d._id).join(', ')}`);
                // Store notification about found drivers
                storeRideStatusUpdate(userId, {
                    type: 'drivers_found',
                    rideId: ride._id,
                    driverCount: nearbyDrivers.length,
                    timestamp: new Date()
                });
            }

            // Return response with the ride and driver count
            return res.status(201).json({ 
                message: 'Emergency request created successfully', 
                ride,
                driverCount: nearbyDrivers.length
            });

        } catch (error) {
            console.error('Error creating emergency request:', error.message);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },

    findNearbyDrivers: async (req, res) => {
        try {
            const { rideId } = req.params;
            const ride = await rideService.getRideById(rideId);
            
            if (!ride) {
                return res.status(404).json({ error: 'Emergency request not found' });
            }

            const nearbyDrivers = await rideService.findNearbyDrivers(
                ride.emergencyLocation,
                ride.serviceType,
                ride.emergencyType
            );

            return res.status(200).json({
                message: 'Nearby drivers found',
                count: nearbyDrivers.length,
                drivers: nearbyDrivers
            });

        } catch (error) {
            console.error('Error finding nearby drivers:', error.message);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },

    acceptRide: async (req, res) => {
        try {
            const { rideId } = req.params;
            const captainId = req.user.id;

            const ride = await rideService.acceptRide(rideId, captainId);

            if (!ride) {
                return res.status(404).json({ error: 'Emergency request not found or already accepted' });
            }

            // Store the ride acceptance notification for the user to poll
            storeRideStatusUpdate(ride.user, {
                type: 'ride_accepted',
                rideId,
                captainId,
                timestamp: new Date()
            });

            return res.status(200).json({ 
                message: 'Emergency request accepted successfully',
                ride
            });

        } catch (error) {
            console.error('Error accepting emergency request:', error.message);
            return res.status(400).json({ error: error.message });
        }
    },

    startRide: async (req, res) => {
        try {
            const { rideId } = req.params;
            const captainId = req.user.id;

            const ride = await rideService.startRide(rideId, captainId);

            if (!ride) {
                return res.status(404).json({ error: 'Emergency request not found or not accepted yet' });
            }

            return res.status(200).json({
                message: 'Emergency response started successfully',
                ride
            });

        } catch (error) {
            console.error('Error starting emergency response:', error.message);
            return res.status(400).json({ error: error.message });
        }
    },

    // New API endpoint for users to check for ride status updates
    getRideStatusUpdates: async (req, res) => {
        try {
            const userId = req.user.id;
            const updates = getRideStatusUpdatesForUser(userId);

            return res.status(200).json({
                updates
            });
        } catch (error) {
            console.error('Error getting ride status updates:', error.message);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
};

/**
 * Store a ride status update for a user to poll
 */
function storeRideStatusUpdate(userId, update) {
    if (!rideStatusUpdates.has(userId)) {
        rideStatusUpdates.set(userId, []);
    }
    
    rideStatusUpdates.get(userId).push(update);
    
    // Limit the number of stored updates per user
    const userUpdates = rideStatusUpdates.get(userId);
    if (userUpdates.length > 50) {
        // Keep only the 50 most recent updates
        rideStatusUpdates.set(userId, userUpdates.slice(-50));
    }
}

/**
 * Get ride status updates for a user
 */
function getRideStatusUpdatesForUser(userId) {
    if (!rideStatusUpdates.has(userId)) {
        return [];
    }
    
    // Return updates and clear them
    const updates = rideStatusUpdates.get(userId);
    rideStatusUpdates.set(userId, []);
    return updates;
}

// Export the controller
module.exports = RideController;
