const rideService = require('../services/ride.service');
const captainService = require('../services/captain.service');
const notificationController = require('./notification.controller');
const { validationResult } = require('express-validator');

// Store ride status updates for users
const rideStatusUpdates = new Map();

// Store active ride assignments
const activeRides = new Map();

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
            
            if (nearbyDrivers.length === 0) {
                // Store notification about no drivers
                storeRideStatusUpdate(userId, {
                    type: 'no_drivers',
                    rideId: ride._id,
                    message: "No available drivers found for your request.",
                    timestamp: new Date()
                });
                
                return res.status(200).json({ 
                    message: 'No drivers available at the moment',
                    ride
                });
            }

            // Store notification about found drivers
            storeRideStatusUpdate(userId, {
                type: 'drivers_found',
                rideId: ride._id,
                driverCount: nearbyDrivers.length,
                timestamp: new Date()
            });
            
            // Setup polling model for ride request
            setupPollingRequest(ride._id.toString(), userId, nearbyDrivers);

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

            // Cancel polling for this ride
            if (activeRides.has(rideId)) {
                const rideInfo = activeRides.get(rideId);
                if (rideInfo.timer) {
                    clearTimeout(rideInfo.timer);
                }
                rideInfo.accepted = true;
                activeRides.set(rideId, rideInfo);
            }

            // Store acceptance notification
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

            // Store ride started notification
            storeRideStatusUpdate(ride.user, {
                type: 'ride_started',
                rideId,
                timestamp: new Date()
            });

            return res.status(200).json({
                message: 'Emergency response started successfully',
                ride
            });

        } catch (error) {
            console.error('Error starting emergency response:', error.message);
            return res.status(400).json({ error: error.message });
        }
    },

    // Get ride status updates for a user
    getRideStatusUpdates: async (req, res) => {
        try {
            const userId = req.user.id;
            const updates = getRideStatusUpdatesForUser(userId);

            // Always return 200 with empty updates array if none exist
            return res.status(200).json({
                updates: updates || []
            });
        } catch (error) {
            console.error('Error getting ride status updates:', error.message);
            // Return empty updates instead of error
            return res.status(200).json({
                updates: []
            });
        }
    },

    // Check for available ride requests
    checkForRideRequests: async (req, res) => {
        try {
            const captainId = req.user.id;
            
            // Get captain details
            const captain = await captainService.getCaptainById(captainId);
            if (!captain || !captain.location) {
                return res.status(200).json({
                    rideRequest: null,
                    message: 'No location available'
                });
            }

            // Check if this captain has any pending ride requests
            const pendingRideRequest = findPendingRideForCaptain(captainId);
            
            if (pendingRideRequest) {
                // Fetch full ride details with populated user data
                const rideDetails = await rideService.getRideById(pendingRideRequest.rideId);
                
                if (!rideDetails) {
                    return res.status(200).json({
                        rideRequest: null
                    });
                }

                // Format user name properly
                const userName = rideDetails.user ? 
                    `${rideDetails.user.firstname || ''} ${rideDetails.user.lastname || ''}`.trim() || 'Anonymous' : 
                    'Anonymous';
                
                return res.status(200).json({
                    rideRequest: {
                        ...pendingRideRequest,
                        emergencyLocation: rideDetails.emergencyLocation,
                        emergencyType: rideDetails.emergencyType || 'Not specified',
                        description: rideDetails.description || '',
                        serviceType: rideDetails.serviceType,
                        userName,
                        userPhone: rideDetails.user?.phone || null,
                        user: rideDetails.user,
                        distance: '1-3 km'  // Placeholder - calculate in production
                    }
                });
            }

            return res.status(200).json({
                rideRequest: null
            });

        } catch (error) {
            console.error('Error checking for ride requests:', error.message);
            return res.status(200).json({
                rideRequest: null,
                message: 'Error checking for rides'
            });
        }
    },

    getRideById: async (req, res) => {
        try {
            const { rideId } = req.params;
            const ride = await rideService.getRideById(rideId);
            
            if (!ride) {
                return res.status(404).json({ error: 'Ride not found' });
            }
            
            return res.status(200).json({
                ride
            });
        } catch (error) {
            console.error('Error getting ride by ID:', error.message);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    }
};

/**
 * Store ride status update for a user
 * @param {string} userId - The user ID
 * @param {Object} update - The update data
 */
function storeRideStatusUpdate(userId, update) {
    const updates = rideStatusUpdates.get(userId) || [];
    updates.push(update);
    rideStatusUpdates.set(userId, updates);
}

/**
 * Setup polling request model for a ride
 * @param {string} rideId - The ride ID
 * @param {string} userId - The user ID
 * @param {Array} drivers - Array of nearby drivers
 */
function setupPollingRequest(rideId, userId, drivers) {
    console.log(`Setting up polling for ride ${rideId} with ${drivers.length} drivers`);
    
    activeRides.set(rideId, {
        currentIndex: 0,
        drivers,
        timer: null,
        accepted: false,
        userId
    });
    
    // Start polling with the first driver
    pollNextDriver(rideId);
}

/**
 * Poll the next driver in the queue
 * @param {string} rideId - The ride ID
 */
async function pollNextDriver(rideId) {
    const ride = activeRides.get(rideId);
    
    if (!ride || ride.accepted) {
        console.log(`Ride ${rideId} is already accepted or not found`);
        return;
    }
    
    // Check if we've gone through all drivers
    if (ride.currentIndex >= ride.drivers.length) {
        console.log(`All ${ride.drivers.length} drivers have been polled for ride ${rideId}`);
        
        // Notify user that no drivers accepted
        storeRideStatusUpdate(ride.userId, {
            type: 'no_driver_accepted',
            rideId,
            message: "No drivers accepted your request.",
            timestamp: new Date()
        });
        
        // Remove from active rides
        activeRides.delete(rideId);
        return;
    }
    
    const currentDriver = ride.drivers[ride.currentIndex];
    console.log(`Polling driver ${currentDriver._id} for ride ${rideId}`);
    
    // Get the ride details to send to the driver
    const rideDetails = await rideService.getRideById(rideId);
    
    if (!rideDetails || rideDetails.status !== 'pending') {
        console.log(`Ride ${rideId} is no longer pending, stopping polling`);
        activeRides.delete(rideId);
        return;
    }
    
    // Store the request in the driver's queue (will be retrieved when driver polls)
    notificationController.pushRideRequest(currentDriver._id, rideDetails);
    
    // Set a timer to move to the next driver if no response
    ride.timer = setTimeout(async () => {
        console.log(`No response from driver ${currentDriver._id} within 15 seconds`);
        
        // Move to the next driver
        ride.currentIndex++;
        activeRides.set(rideId, ride);
        
        // Poll the next driver
        await pollNextDriver(rideId);
    }, 15000); // 15 seconds timeout
    
    // Update the active ride
    activeRides.set(rideId, ride);
}

/**
 * Find a pending ride for a specific captain
 * @param {string} captainId - The captain ID
 * @returns {Object|null} The ride request or null
 */
function findPendingRideForCaptain(captainId) {
    for (const [rideId, ride] of activeRides.entries()) {
        if (!ride.accepted && 
            ride.currentIndex < ride.drivers.length && 
            ride.drivers[ride.currentIndex]._id.toString() === captainId) {
            
            // Get the ride details
            return {
                rideId,
                timeoutSeconds: 15,
                timestamp: new Date()
            };
        }
    }
    
    return null;
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
