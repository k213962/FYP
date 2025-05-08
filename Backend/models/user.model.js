const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname: {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true }
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cnic: { type: String, required: true, unique: true }, // CNIC Number
    mobile: { type: String, required: true, unique: true } // Mobile Number
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
