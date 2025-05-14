module.exports = {
    // Time to wait for a driver to respond to a ride request (in milliseconds)
    DRIVER_NOTIFICATION_TIMEOUT: 15000, // 15 seconds

    // Other configuration settings can be added here
    NODE_ENV: process.env.NODE_ENV || 'development'
}; 