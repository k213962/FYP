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
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
      required: true
    }
  },
  hoursOnline: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Online', 'Offline'],
    default: 'Offline'
  },
  resetOTP: {
    type: String,
    default: null
  },
  resetOTPExpiry: {
    type: Date,
    default: null
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
