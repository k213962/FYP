const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    current: {
        type: String,
    },
    destination: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    }, 
    distance: {
        type: Number,

    },
    vehicleType: {
        type: String,
        enum: ['Ambulance', 'Fire', 'Police'],
        required: true
    },
});

// THIS is the correct way to export the model
module.exports = mongoose.model('ride', rideSchema);
