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
    driverLicense: { type: String, required: true },
    vehiclePlateNo: { type: String, required: true },
    vehicleType: { type: String, required: true, enum: ['Ambulance', 'Police', 'Fire Brigade'] }
}, { timestamps: true });

module.exports = mongoose.model('Captain', captainSchema);