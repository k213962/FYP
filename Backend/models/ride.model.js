const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Captain',
    },
    emergencyLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    serviceType: {
        type: String,
        required: true,
        enum: ['ambulance', 'fire', 'police']
    },
    emergencyType: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    completionTime: {
        type: Date
    }
}, { 
    timestamps: true 
});

// Create geospatial index for emergency location
rideSchema.index({ emergencyLocation: '2dsphere' });

// Force index creation
const Ride = mongoose.model('Ride', rideSchema);
Ride.init()
    .then(() => console.log('Ride indexes built successfully.'))
    .catch(err => console.error('Error building indexes:', err));

module.exports = Ride;
