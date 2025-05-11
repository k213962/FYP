const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com)$/, 'Email must be Gmail or Hotmail']
    },
    password: {
        type: String,
        required: true,
        minlength: [6, 'Password must be at least 6 characters long']
    },
    cnic: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{13}$/, 'CNIC must be 13 digits (e.g., 4212345678901)']
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        match: [/^(\+92|03)\d{9}$/, 'Mobile must be +923XXXXXXXXX or 03XXXXXXXXX']
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
