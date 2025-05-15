const rideService = require('../services/ride.service');
const captainService = require('../services/captain.service');

// In-memory store for captain notifications
// In production, this would be stored in a database
const pendingNotifications = new Map();

// Store notification acknowledgments
const notificationAcknowledgments = new Map();

const NotificationController = {
  /**
   * Poll for available ride requests
   * This endpoint will be called periodically by captains to check for new ride requests
   */
  pollAvailableRequests: async (req, res) => {
    try {
      const captainId = req.user.id;
      
      // Get captain details to check eligibility
      const captain = await captainService.getCaptainById(captainId);
      
      if (!captain) {
        return res.status(404).json({ error: 'Captain not found' });
      }
      
      // Only send requests to online captains
      if (captain.status !== 'Online') {
        return res.status(200).json({ 
          success: true, 
          notifications: []
        });
      }
      
      // Get captain's current location
      const captainLocation = captain.location;
      
      // Get pending notifications for this captain
      let notifications = pendingNotifications.get(captainId) || [];
      
      // If there are no pending notifications, check for new ride requests
      if (notifications.length === 0) {
        // Find nearby pending rides within 50km radius (matching driver search radius)
        const pendingRides = await rideService.getNearbyPendingRides(
          captainLocation.coordinates[0], // longitude
          captainLocation.coordinates[1], // latitude
          50, // radius in km - increased to match driver search radius
          captain.vehicleType // vehicle type
        );
        
        if (pendingRides && pendingRides.length > 0) {
          console.log(`[NOTIFICATION] Found ${pendingRides.length} pending rides for captain ${captainId}`);
          
          // Map rides to notification format
          notifications = pendingRides.map(ride => ({
            type: 'ride_request',
            rideId: ride._id.toString(),
            emergencyType: ride.emergencyType,
            emergencyLocation: ride.emergencyLocation,
            description: ride.description,
            timeoutSeconds: 15, // Default timeout
            timestamp: new Date(),
            userId: ride.user.toString(),
            distanceInKm: ride.distance || 0,
            estimatedArrivalTime: calculateETA(ride.distance || 0)
          }));
          
          // Store for future reference
          pendingNotifications.set(captainId, notifications);
          
          // Log the notifications being sent
          console.log(`[NOTIFICATION] Sending ${notifications.length} notifications to captain ${captainId}:`, 
            notifications.map(n => ({ rideId: n.rideId, distance: n.distanceInKm })));
        } else {
          console.log(`[NOTIFICATION] No pending rides found for captain ${captainId}`);
        }
      } else {
        console.log(`[NOTIFICATION] Using ${notifications.length} existing notifications for captain ${captainId}`);
      }
      
      // Return the notifications but don't clear them yet
      const response = {
        success: true,
        notifications
      };
      
      return res.status(200).json(response);
    } catch (error) {
      console.error('Error in pollAvailableRequests:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  /**
   * Acknowledge notification receipt
   * Called by the frontend when a notification is processed
   */
  acknowledgeNotification: async (req, res) => {
    try {
      const { rideId } = req.params;
      const captainId = req.user.id;
      
      // Get current notifications
      const notifications = pendingNotifications.get(captainId) || [];
      
      // Remove the acknowledged notification
      const updatedNotifications = notifications.filter(n => n.rideId !== rideId);
      
      // Update stored notifications
      pendingNotifications.set(captainId, updatedNotifications);
      
      // Store acknowledgment
      const acks = notificationAcknowledgments.get(captainId) || [];
      acks.push({ rideId, timestamp: new Date() });
      notificationAcknowledgments.set(captainId, acks);
      
      console.log(`[NOTIFICATION] Captain ${captainId} acknowledged notification for ride ${rideId}`);
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  /**
   * Manually push a ride request notification to a specific captain
   * For internal use by other controllers
   */
  pushRideRequest: async (captainId, rideData) => {
    try {
      // Get existing notifications or create new array
      const existingNotifications = pendingNotifications.get(captainId) || [];
      
      // Check if this ride is already in notifications
      if (existingNotifications.some(n => n.rideId === rideData._id.toString())) {
        console.log(`[NOTIFICATION] Ride ${rideData._id} already in notifications for captain ${captainId}`);
        return true;
      }
      
      // Add the new notification
      existingNotifications.push({
        type: 'ride_request',
        rideId: rideData._id.toString(),
        emergencyType: rideData.emergencyType,
        emergencyLocation: rideData.emergencyLocation,
        description: rideData.description,
        timeoutSeconds: 15, // Default timeout
        timestamp: new Date(),
        userId: rideData.user.toString(),
        distanceInKm: rideData.distance || 0,
        estimatedArrivalTime: calculateETA(rideData.distance || 0)
      });
      
      // Update the stored notifications
      pendingNotifications.set(captainId, existingNotifications);
      
      console.log(`[NOTIFICATION] Pushed ride request ${rideData._id} to captain ${captainId}`);
      return true;
    } catch (error) {
      console.error(`[NOTIFICATION] Error pushing ride request to captain ${captainId}:`, error);
      return false;
    }
  },
  
  /**
   * Clear all pending notifications for a captain
   * For internal use
   */
  clearPendingNotifications: (captainId) => {
    pendingNotifications.set(captainId, []);
    return true;
  },
  
  /**
   * For debugging - view all pending notifications
   * Only available in development environment
   */
  getAllPendingNotifications: (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Not available in production' });
    }
    
    const allNotifications = {};
    pendingNotifications.forEach((notifications, captainId) => {
      allNotifications[captainId] = notifications;
    });
    
    return res.status(200).json({ pendingNotifications: allNotifications });
  },
  
  /**
   * Manually send a notification to a captain (for testing)
   */
  sendTestNotification: async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Not available in production' });
    }
    
    try {
      const { captainId } = req.params;
      const testData = {
        _id: 'test-ride-' + Date.now(),
        emergencyType: 'Test',
        emergencyLocation: {
          address: 'Test Location',
          latitude: 24.8607,
          longitude: 67.0011
        },
        description: 'This is a test notification',
        user: req.user.id || 'test-user',
        distance: 1.5
      };
      
      const result = await NotificationController.pushRideRequest(captainId, testData);
      
      return res.status(200).json({
        success: result,
        message: result ? 'Test notification sent' : 'Failed to send notification'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Helper function to calculate estimated arrival time based on distance
function calculateETA(distanceInKm) {
  // Assume average speed of 30 km/h in city traffic
  const timeInHours = distanceInKm / 30;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  
  if (timeInMinutes < 1) {
    return 'Less than a minute';
  } else if (timeInMinutes === 1) {
    return '1 minute';
  } else if (timeInMinutes < 60) {
    return `${timeInMinutes} minutes`;
  } else {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
  }
}

module.exports = NotificationController; 