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

            // Find nearby drivers
            const nearbyDrivers = await rideService.findNearbyDrivers(emergencyLocation, serviceType);

            // Notify nearby drivers and add them to a room for this ride
            const io = socketIO.getIO();
            nearbyDrivers.forEach(driver => {
                io.to(driver._id.toString()).emit('newEmergencyRequest', {
                    rideId: ride._id,
                    emergencyLocation,
                    serviceType,
                    emergencyType,
                    description
                });

                // Optional: you can have drivers join the ride room on client-side
                // socket.join(`ride_${ride._id}`);
            });

            return res.status(201).json({ 
                message: 'Emergency request created successfully', 
                ride,
                nearbyDrivers: nearbyDrivers.length
            });

        } catch (error) {
            console.error('Error creating emergency request:', error.message);
            return res.status(500).json({ error: error.message || 'Internal server error' });
        }
    },

    acceptRide: async (req, res) => {
        try {
            const { rideId } = req.params;
            const captainId = req.user.id;

            const ride = await rideService.acceptRide(rideId, captainId);

            if (!ride) {
                return res.status(404).json({ error: 'Ride not found or already accepted' });
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
                return res.status(404).json({ error: 'Ride not found or not accepted yet' });
            }

            return res.status(200).json({
                message: 'Ride started successfully',
                ride
            });

        } catch (error) {
            console.error('Error starting ride:', error.message);
            return res.status(400).json({ error: error.message });
        }
    }
};

module.exports = RideController;
