const rideModel = require('../models/ride.model');

module.exports.createRide = async (userId, destination, vehicleType) => {
    console.log('Service Parameters:', { userId, destination, vehicleType });

    if (!userId || !destination || !vehicleType) {
        throw new Error('User, destination, and vehicle type are required');
    }

    const ride = await rideModel.create({
        user: userId,  // Save the userId here
        destination: destination,
        vehicleType: vehicleType,
    });

    return ride;
};
