const express = require('express');
const router = express.Router();
const Captain = require('../models/captain');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ... existing code ...

// Update captain location
router.post('/location', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }

    const captain = await Captain.findById(req.captain.id);
    if (!captain) {
      return res.status(404).json({ message: 'Captain not found' });
    }

    captain.currentLocation = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    captain.lastLocationUpdate = new Date();
    
    await captain.save();
    
    res.json({ 
      message: 'Location updated successfully',
      location: captain.currentLocation
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby drivers
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, serviceType, maxDistance = 5000 } = req.query; // maxDistance in meters
    
    if (!latitude || !longitude || !serviceType) {
      return res.status(400).json({ 
        message: 'Latitude, longitude, and serviceType are required' 
      });
    }

    const nearbyDrivers = await Captain.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      serviceType,
      isOnline: true,
      currentStatus: 'available'
    }).select('-password');

    res.json(nearbyDrivers);
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ... existing code ...

module.exports = router; 