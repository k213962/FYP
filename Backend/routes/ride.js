const express = require('express');
const router = express.Router();
const Ride = require('../models/ride');
const Captain = require('../models/captain');
const auth = require('../middleware/auth');

// Create a new emergency request
router.post('/', auth, async (req, res) => {
  try {
    const { 
      emergencyLocation, 
      serviceType,
      emergencyType,
      description 
    } = req.body;

    // Validate required fields
    if (!emergencyLocation || !serviceType) {
      return res.status(400).json({ 
        message: 'Emergency location and service type are required' 
      });
    }

    // Create the emergency request without a driver initially
    const ride = new Ride({
      user: req.user.id,
      emergencyLocation,
      serviceType,
      emergencyType,
      description,
      status: 'pending',
      estimatedArrivalTime: new Date(Date.now() + 15 * 60000) // 15 minutes from now
    });

    await ride.save();

    // Start driver matching process
    findAndAssignDriver(ride._id);

    res.status(201).json({
      message: 'Emergency request created successfully',
      ride
    });

  } catch (error) {
    console.error('Error creating emergency request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Function to find and assign a driver
async function findAndAssignDriver(rideId) {
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'pending') {
      return;
    }

    // Find nearby available drivers
    const nearbyDrivers = await Captain.find({
      currentLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [
              ride.emergencyLocation.coordinates[0],
              ride.emergencyLocation.coordinates[1]
            ]
          },
          $maxDistance: 5000 // 5km radius
        }
      },
      serviceType: ride.serviceType,
      isOnline: true,
      currentStatus: 'available'
    }).sort({ 'currentLocation.coordinates': 1 }).limit(1);

    if (nearbyDrivers.length === 0) {
      // No drivers found, keep ride pending
      console.log('No available drivers found for emergency:', rideId);
      return;
    }

    const selectedDriver = nearbyDrivers[0];

    // Update ride with driver information
    ride.captain = selectedDriver._id;
    ride.status = 'accepted';
    await ride.save();

    // Update driver status
    selectedDriver.currentStatus = 'busy';
    await selectedDriver.save();

    // Here you would typically send a notification to the driver
    console.log('Driver assigned to emergency:', {
      rideId,
      driverId: selectedDriver._id,
      driverName: `${selectedDriver.fullname.firstname} ${selectedDriver.fullname.lastname}`
    });

  } catch (error) {
    console.error('Error in driver matching process:', error);
  }
}

// Get emergency request status
router.get('/:id', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('captain', 'fullname vehicleType vehicleNoPlate currentLocation')
      .populate('user', 'fullname phone');

    if (!ride) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    res.json(ride);
  } catch (error) {
    console.error('Error fetching emergency request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update emergency request status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ message: 'Emergency request not found' });
    }

    ride.status = status;
    
    if (status === 'in-progress') {
      ride.actualArrivalTime = new Date();
    } else if (status === 'completed') {
      ride.completionTime = new Date();
      
      // Update driver status back to available
      if (ride.captain) {
        const driver = await Captain.findById(ride.captain);
        if (driver) {
          driver.currentStatus = 'available';
          await driver.save();
        }
      }
    }

    await ride.save();
    res.json(ride);
  } catch (error) {
    console.error('Error updating emergency request status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 