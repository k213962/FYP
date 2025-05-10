const mongoose = require('mongoose');

const captainSchema = new mongoose.Schema({
  fullname: {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true }
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cnic: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  vehicleNoPlate: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true },
  driverLicense: { type: String, required: true },
  serviceType: { type: String, required: true, enum: ['ambulance', 'fire', 'police'] },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  lastLocationUpdate: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  currentStatus: { 
    type: String, 
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },
  hoursOnline: { type: Number, default: 0 },
  status: { type: String, default: 'Offline' }
}, { timestamps: true });

// Create geospatial index for location queries
captainSchema.index({ currentLocation: '2dsphere' });

const Captain = mongoose.model('Captain', captainSchema);

module.exports = Captain; 