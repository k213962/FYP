const Emergency = require('../models/emergency.model');
const EmergencyDispatchService = require('../services/emergencyDispatch.service');

// Create a new emergency
exports.createEmergency = async (req, res) => {
  try {
    const { location, description, userId } = req.body;

    // Validate required fields
    if (!location || !description || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Location, description, and userId are required'
      });
    }

    // Create new emergency
    const emergency = new Emergency({
      location,
      description,
      userId,
      status: 'pending',
      createdAt: new Date()
    });

    // Save emergency
    await emergency.save();

    // Handle emergency dispatch
    const dispatchResult = await EmergencyDispatchService.handleEmergencyDispatch(emergency);

    // Update emergency with dispatch results
    emergency.dispatchStatus = dispatchResult;
    await emergency.save();

    // Return response
    res.status(201).json({
      success: true,
      data: {
        emergency,
        dispatchResult
      }
    });

  } catch (error) {
    console.error('Error creating emergency:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating emergency',
      error: error.message
    });
  }
};

// Get emergency by ID
exports.getEmergencyById = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('userId', 'fullname email mobile')
      .populate('assignedDrivers.driverId', 'fullname serviceType currentLocation');

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    res.status(200).json({
      success: true,
      data: emergency
    });

  } catch (error) {
    console.error('Error fetching emergency:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emergency',
      error: error.message
    });
  }
};

// Update emergency status
exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    emergency.status = status;
    await emergency.save();

    // Notify assigned drivers about status change
    if (emergency.assignedDrivers && emergency.assignedDrivers.length > 0) {
      emergency.assignedDrivers.forEach(driver => {
        global.io.emit(`driver_${driver.driverId}`, {
          type: 'EMERGENCY_STATUS_UPDATE',
          data: {
            emergencyId: emergency._id,
            status
          }
        });
      });
    }

    res.status(200).json({
      success: true,
      data: emergency
    });

  } catch (error) {
    console.error('Error updating emergency status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating emergency status',
      error: error.message
    });
  }
};

// Get emergencies by user ID
exports.getEmergenciesByUserId = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('assignedDrivers.driverId', 'fullname serviceType');

    res.status(200).json({
      success: true,
      data: emergencies
    });

  } catch (error) {
    console.error('Error fetching user emergencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user emergencies',
      error: error.message
    });
  }
};

// Get active emergencies
exports.getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('userId', 'fullname email mobile')
      .populate('assignedDrivers.driverId', 'fullname serviceType currentLocation');

    res.status(200).json({
      success: true,
      data: emergencies
    });

  } catch (error) {
    console.error('Error fetching active emergencies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active emergencies',
      error: error.message
    });
  }
}; 