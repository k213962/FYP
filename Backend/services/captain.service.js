const Captain = require('../models/captain.model');

exports.createCaptain = async (captainData) => {
    const captain = new Captain(captainData);
    await captain.save();
    return captain;
};

// Example of a service to find a captain by email
exports.findCaptainByEmail = async (email) => {
    return await Captain.findOne({ email });
};