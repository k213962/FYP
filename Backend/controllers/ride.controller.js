const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const socketIO = require('../socket');

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

            // Return response immediately after creating the request
            res.status(201).json({ 
                message: 'Emergency request created successfully', 
                ride
            });

            // Handle driver search and notification asynchronously
            try {
                // Find nearby drivers
                const nearbyDrivers = await rideService.findNearbyDrivers(
                    ride.emergencyLocation,
                    ride.serviceType
                );

                // Notify nearby drivers about the emergency
                const io = socketIO.getIO();
                nearbyDrivers.forEach(driver => {
                    io.to(driver._id.toString()).emit('newEmergencyRequest', {
                        rideId: ride._id,
                        emergencyLocation: ride.emergencyLocation,
                        serviceType: ride.serviceType,
                        emergencyType: ride.emergencyType,
                        description: ride.description
                    });
                });

                // Log the number of drivers notified
                console.log(`Notified ${nearbyDrivers.length} nearby drivers for emergency request ${ride._id}`);
            } catch (error) {
                console.error('Error in driver search and notification process:', error);
                // Don't throw the error as the request was already created successfully
            }

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
                ride.serviceType
            );

            // Notify nearby drivers
            const io = socketIO.getIO();
            nearbyDrivers.forEach(driver => {
                io.to(driver._id.toString()).emit('newEmergencyRequest', {
                    rideId: ride._id,
                    emergencyLocation: ride.emergencyLocation,
                    serviceType: ride.serviceType,
                    emergencyType: ride.emergencyType,
                    description: ride.description
                });
            });

            return res.status(200).json({
                message: 'Nearby drivers found',
                nearbyDrivers: nearbyDrivers.length,
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

            // Notify all drivers in the ride room that it was accepted
            const io = socketIO.getIO();
            io.to(`ride_${rideId}`).emit('emergencyRequestAccepted', {
                rideId,
                acceptedBy: captainId
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
    }
};

module.exports = RideController;
