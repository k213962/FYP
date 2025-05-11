const rideModel = require('../models/ride.model');
const Captain = require('../models/captain.model');

module.exports.createRide = async (userId, emergencyData) => {
    const { emergencyLocation, serviceType, emergencyType, description, estimatedArrivalTime } = emergencyData;

    // Log the received data for debugging
    console.log('Creating ride with data:', {
        userId,
        emergencyLocation,
        serviceType,
        emergencyType,
        description,
        estimatedArrivalTime
    });

    // Validate each field individually
    if (!userId) throw new Error('User ID is required');
    if (!emergencyLocation) throw new Error('Emergency location is required');
    if (!serviceType) throw new Error('Service type is required');
    if (!emergencyType) throw new Error('Emergency type is required');
    if (!description) throw new Error('Description is required');
    if (!estimatedArrivalTime) throw new Error('Estimated arrival time is required');

    // Validate emergency location format
    if (!emergencyLocation.type || emergencyLocation.type !== 'Point') {
        throw new Error('Invalid emergency location type');
    }
    if (!Array.isArray(emergencyLocation.coordinates) || emergencyLocation.coordinates.length !== 2) {
        throw new Error('Invalid emergency location coordinates');
    }

    // Validate service type
    const validServiceTypes = ['ambulance', 'fire', 'police'];
    if (!validServiceTypes.includes(serviceType)) {
        throw new Error(`Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`);
    }

    try {
        // Convert estimatedArrivalTime to Date object if it's a string
        const arrivalTime = estimatedArrivalTime instanceof Date 
            ? estimatedArrivalTime 
            : new Date(estimatedArrivalTime);

        if (isNaN(arrivalTime.getTime())) {
            throw new Error('Invalid estimated arrival time format');
        }

        const ride = await rideModel.create({
            user: userId,
            emergencyLocation,
            serviceType,
            emergencyType,
            description,
            estimatedArrivalTime: arrivalTime,
            status: 'pending'
        });

        console.log('Ride created successfully:', ride);
        return ride;
    } catch (error) {
        console.error('Error creating ride:', error);
        throw error;
    }
};

module.exports.findNearbyDrivers = async (emergencyLocation, serviceType, limit = 3) => {
    // Convert service type to match captain's vehicleType
    let vehicleType = serviceType;
    if (serviceType === 'fire brigade') {
        vehicleType = 'fire';
    }

    const drivers = await Captain.find({
        vehicleType: vehicleType,
        status: 'Online',
        location: {
            $exists: true,
            $ne: null
        }
    }).near('location', {
        center: emergencyLocation.coordinates,
        maxDistance: 10000 // 10km radius
    }).limit(limit);

    return drivers;
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
                captain: captainId
            }
        },
        { new: true }
    );

    if (!ride) {
        throw new Error('Ride not available or already accepted');
    }

    // Update captain status to busy
    await Captain.findByIdAndUpdate(captainId, { status: 'Offline' });

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
                status: 'ride-started',
                actualArrivalTime: new Date()
            }
        },
        { new: true }
    );

    if (!ride) {
        throw new Error('Invalid ride or captain');
    }

    return ride;
};
