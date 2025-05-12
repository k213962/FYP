const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedDrivers: [{
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    serviceType: {
      type: String,
      enum: ['ambulance', 'fire', 'police']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'rejected', 'completed'],
      default: 'assigned'
    }
  }],
  dispatchStatus: {
    success: Boolean,
    requiredServices: [String],
    dispatchResults: {
      assigned: [{
        service: String,
        driverId: mongoose.Schema.Types.ObjectId,
        dispatchId: mongoose.Schema.Types.ObjectId
      }],
      failed: [String]
    },
    message: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
emergencySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Emergency', emergencySchema); 