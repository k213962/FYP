// Update a specific captain's location to be near Ayesha Manzil for testing
require('dotenv').config();
const mongoose = require('mongoose');
const Captain = require('../models/captain.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency-app')
  .then(() => {
    console.log('Connected to MongoDB');
    updateCaptainLocation();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function updateCaptainLocation() {
  try {
    // Find the captain with email rehman1@gmail.com
    let captain = await Captain.findOne({ email: 'rehman1@gmail.com' });
    
    if (!captain) {
      console.log('Captain not found with email rehman1@gmail.com');
      return;
    }
    
    console.log(`\nFound captain: ${captain.fullname.firstname} ${captain.fullname.lastname}`);
    console.log(`Current status: ${captain.status}`);
    console.log(`Current location: ${captain.location?.coordinates ? JSON.stringify(captain.location.coordinates) : 'No location set'}`);
    
    // Calculate a location within 2km of Ayesha Manzil (67.0645785, 24.9273331)
    // This is approximately 0.01 degrees shift in coordinates
    const ayeshaManzilLong = 67.0645785;
    const ayeshaManzilLat = 24.9273331;
    const nearby = {
      longitude: ayeshaManzilLong - 0.005, // Slightly west
      latitude: ayeshaManzilLat - 0.005    // Slightly south
    };
    
    // Update the captain's location and ensure status is Online
    const result = await Captain.findByIdAndUpdate(
      captain._id,
      {
        status: 'Online',
        location: {
          type: 'Point',
          coordinates: [nearby.longitude, nearby.latitude],
          lastUpdated: new Date()
        }
      },
      { new: true }
    );
    
    console.log('\nCaptain updated successfully!');
    console.log(`New status: ${result.status}`);
    console.log(`New location: ${JSON.stringify(result.location.coordinates)}`);
    console.log(`Distance from emergency: Approximately 0.5-1km`);
    
    // For convenience, output the emergency coordinates
    console.log(`\nEmergency (Ayesha Manzil) coordinates: [${ayeshaManzilLong}, ${ayeshaManzilLat}]`);
    console.log('For testing, create an emergency at Ayesha Manzil');

  } catch (error) {
    console.error('Error updating captain location:', error);
  } finally {
    mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
} 