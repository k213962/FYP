const mongoose = require('mongoose');

const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true }
    },
    email: { type: String, required: true },
    password: { type: String, required: true },
    cnic: { type: String, required: true },
    phone: { type: String, required: true },
    driverLicense: { type: String, required: true },
    vehicleNoPlate: { type: String, required: true },
    vehicleType: { 
        type: String, 
        required: true,
        enum: ['ambulance', 'fire-brigade', 'police']
    },
    hoursOnline: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['Online', 'Offline'],
        default: 'Offline'
    }
}, { 
    timestamps: true
});

// Create indexes
captainSchema.index({ email: 1 }, { unique: true });
captainSchema.index({ cnic: 1 }, { unique: true });
captainSchema.index({ phone: 1 }, { unique: true });
captainSchema.index({ driverLicense: 1 }, { unique: true });
captainSchema.index({ vehicleNoPlate: 1 }, { unique: true });

module.exports = mongoose.model('Captain', captainSchema);