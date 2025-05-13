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
    enum: ['ambulance', 'fire', 'police']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      },
      default: [74.3587, 31.5204] // Default to Lahore coordinates
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  hoursOnline: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Online', 'Offline', 'Busy'],
    default: 'Offline'
  },
  resetOTP: {
    type: String,
    default: null
  },
  resetOTPExpiry: {
    type: Date,
    default: null
  },
  currentEmergency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride'
  }
}, { 
  timestamps: true
});

// Indexes
captainSchema.index({ email: 1 }, { unique: true });
captainSchema.index({ cnic: 1 }, { unique: true });
captainSchema.index({ phone: 1 }, { unique: true });
captainSchema.index({ driverLicense: 1 }, { unique: true });
captainSchema.index({ vehicleNoPlate: 1 }, { unique: true });
captainSchema.index({ location: '2dsphere' });

const Captain = mongoose.model('Captain', captainSchema);

// Force index creation
Captain.init()
  .then(() => console.log('Captain indexes built successfully.'))
  .catch(err => console.error('Error building indexes:', err));

module.exports = Captain;
