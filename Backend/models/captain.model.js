const mongoose = require('mongoose');

const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true }
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    driverLicense: { type: String, required: true, unique: true },
    vehicle: {
        plate: { type: String, required: true, unique: true },
        type: { 
            type: String, 
            required: true,
            enum: ['ambulance', 'fire-brigade', 'police']
        }
    },
    hoursOnline: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['Online', 'Offline'],
        default: 'Offline'
    }
}, { timestamps: true });

module.exports = mongoose.model('Captain', captainSchema);