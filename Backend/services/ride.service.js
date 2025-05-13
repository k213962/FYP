const rideModel = require('../models/ride.model');
const Captain = require('../models/captain.model');

module.exports.createRide = async (userId, emergencyData) => {
    const { emergencyLocation, serviceType, emergencyType, description } = emergencyData;

    // Log the received data for debugging
    console.log('Creating emergency request with data:', {
        userId,
        emergencyLocation,
        serviceType,
        emergencyType,
        description
    });

    // Validate required fields
    if (!userId) throw new Error('User ID is required');
    if (!emergencyLocation) throw new Error('Emergency location is required');
    if (!serviceType) throw new Error('Service type is required');
    if (!emergencyType) throw new Error('Emergency type is required');
    if (!description) throw new Error('Description is required');

    // Validate emergency location format
    if (!emergencyLocation.type || emergencyLocation.type !== 'Point') {
        throw new Error('Invalid emergency location type');
    }
    if (!Array.isArray(emergencyLocation.coordinates) || emergencyLocation.coordinates.length !== 2) {
        throw new Error('Invalid emergency location coordinates');
    }
    if (!emergencyLocation.address) {
        throw new Error('Emergency location address is required');
    }

    // Validate service type
    const validServiceTypes = ['ambulance', 'fire', 'police'];
    if (!validServiceTypes.includes(serviceType)) {
        throw new Error(`Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`);
    }

    try {
        const ride = await rideModel.create({
            user: userId,
            emergencyLocation: {
                type: emergencyLocation.type,
                coordinates: emergencyLocation.coordinates,
                address: emergencyLocation.address
            },
            serviceType,
            emergencyType,
            description,
            status: 'pending',
            createdAt: new Date()
        });

        console.log('Emergency request created successfully:', ride);
        return ride;
    } catch (error) {
        console.error('Error creating emergency request:', error);
        throw error;
    }
};

module.exports.findNearbyDrivers = async (emergencyLocation, serviceType, limit = 3) => {
    // Convert service type to match captain's vehicleType
    let vehicleType = serviceType;
    if (serviceType === 'fire brigade') {
        vehicleType = 'fire';
    }

    try {
        const drivers = await Captain.find({
            vehicleType: vehicleType,
            status: 'Online',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: emergencyLocation.coordinates
                    },
                    $maxDistance: 10000 // 10km radius
                }
            }
        }).limit(limit);

        return drivers;
    } catch (error) {
        console.error('Error finding nearby drivers:', error);
        throw error;
    }
};

module.exports.getRideById = async (rideId) => {
    try {
        const ride = await rideModel.findById(rideId);
        if (!ride) {
            throw new Error('Emergency request not found');
        }
        return ride;
    } catch (error) {
        console.error('Error finding emergency request:', error);
        throw error;
    }
};

module.exports.acceptRide = async (rideId, captainId) => {
    const ride = await rideModel.findOneAndUpdate(
        { 
            _id: rideId,
            status: 'pending'
        },
        {
            $set: {
                status: 'accepted',
                acceptedBy: captainId,
                captain: captainId,
                acceptedAt: new Date()
            }
        },
        { new: true }
    );

    if (!ride) {
        throw new Error('Emergency request not available or already accepted');
    }

    // Update captain status to busy
    await Captain.findByIdAndUpdate(captainId, { 
        status: 'Offline',
        currentEmergency: rideId
    });

    return ride;
};

module.exports.startRide = async (rideId, captainId) => {
    const ride = await rideModel.findOneAndUpdate(
        {
            _id: rideId,
            captain: captainId,
            status: 'accepted'
        },
        {
            $set: {
                status: 'in-progress',
                startedAt: new Date()
            }
        },
        { new: true }
    );

    if (!ride) {
        throw new Error('Invalid emergency request or captain');
    }

    return ride;
};
