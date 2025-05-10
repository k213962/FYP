const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Captain'
  },
  emergencyLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['ambulance', 'fire', 'police']
  },
  emergencyType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  estimatedArrivalTime: {
    type: Date,
    required: true
  },
  actualArrivalTime: {
    type: Date
  },
  completionTime: {
    type: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String
  }
}, { timestamps: true });

// Create geospatial index for emergency location
rideSchema.index({ emergencyLocation: '2dsphere' });

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride; 