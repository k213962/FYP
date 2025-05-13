const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullname: {
        firstname: { type: String, required: true, trim: true },
        lastname: { type: String, required: true, trim: true }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com)$/, 'Email must be Gmail or Hotmail']
    },
    password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters long'],
        match: [/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/, 
            'Password must contain at least one uppercase letter, one number, and one special character']
    },
    cnic: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\d{13}$/, 'CNIC must be 13 digits (e.g., 4212345678901)']
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^(\+92|03)\d{9}$/, 'Mobile must be +923XXXXXXXXX or 03XXXXXXXXX']
    },
    resetOTP: {
        type: String,
        default: null
    },
    resetOTPExpiry: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.updatedAt = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        console.log('Comparing passwords:');
        console.log('Candidate password length:', candidatePassword.length);
        console.log('Stored hash length:', this.password.length);
        
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        console.log('bcrypt.compare result:', isMatch);
        
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        throw error;
    }
};

module.exports = mongoose.model('User', userSchema);
