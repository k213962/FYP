const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { auth } = require('../middlewares/auth.middleware');

// Poll for available ride requests (for captains)
router.get('/poll', auth, notificationController.pollAvailableRequests);

// Debug routes - only available in development environment
if (process.env.NODE_ENV !== 'production') {
  // Get all pending notifications (for debugging)
  router.get('/all', auth, notificationController.getAllPendingNotifications);
  
  // Send test notification to a captain
  router.post('/test/:captainId', auth, notificationController.sendTestNotification);
}

module.exports = router; 