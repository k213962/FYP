const mongoose = require('mongoose');

const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true }
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cnic: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    driverLicense: { type: String, required: true, unique: true },
    vehicleNoPlate: { type: String, required: true, unique: true },
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
    timestamps: true,
    autoIndex: true
});

// Drop all existing indexes
mongoose.connection.on('connected', async () => {
    try {
        await mongoose.connection.db.collection('captains').dropIndexes();
        console.log('Dropped all indexes from captains collection');
    } catch (error) {
        console.log('No indexes to drop or error dropping indexes:', error);
    }
});

// Create new indexes
captainSchema.index({ email: 1 }, { unique: true });
captainSchema.index({ cnic: 1 }, { unique: true });
captainSchema.index({ phone: 1 }, { unique: true });
captainSchema.index({ driverLicense: 1 }, { unique: true });
captainSchema.index({ vehicleNoPlate: 1 }, { unique: true });

module.exports = mongoose.model('Captain', captainSchema);