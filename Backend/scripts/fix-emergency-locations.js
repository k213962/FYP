// Fix invalid emergency locations in existing ride records
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Ride = require('../models/ride.model');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/emergency-app')
  .then(() => {
    console.log('Connected to MongoDB');
    fixInvalidLocations();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixInvalidLocations() {
  try {
    // Get all pending rides
    const pendingRides = await Ride.find({ status: 'pending' });
    console.log(`Found ${pendingRides.length} pending rides to check`);

    let fixedCount = 0;
    let alreadyValidCount = 0;
    let failedCount = 0;

    // Process each ride
    for (const ride of pendingRides) {
      console.log(`\nChecking ride ${ride._id}...`);
      
      // Extract the coordinates
      const coords = ride.emergencyLocation?.coordinates || [];
      
      if (coords.length !== 2) {
        console.log(`Ride ${ride._id} has invalid coordinates format: ${coords}`);
        failedCount++;
        continue;
      }

      let [longitude, latitude] = coords;
      let coordsFixed = false;
      
      // Check if coordinates might be swapped (latitude first, longitude second)
      // Pakistan coordinates should have longitude around 67-77 and latitude around 24-37
      if (longitude >= 20 && longitude <= 40 && latitude >= 60 && latitude <= 80) {
        console.log(`Ride ${ride._id} has swapped coordinates: [${longitude}, ${latitude}]`);
        
        // Swap the coordinates to correct order
        const fixedCoords = [latitude, longitude];
        await Ride.findByIdAndUpdate(
          ride._id,
          { 'emergencyLocation.coordinates': fixedCoords },
          { new: true }
        );
        
        console.log(`✅ Fixed ride ${ride._id} with swapped coordinates: now ${fixedCoords}`);
        fixedCount++;
        coordsFixed = true;
        
        // Update local variables for further checks
        [longitude, latitude] = fixedCoords;
      }
      
      // Check if coordinates are valid
      if (!coordsFixed && (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90)) {
        console.log(`Ride ${ride._id} has invalid coordinates: [${longitude}, ${latitude}]`);
        
        // Fix with default coordinates (Karachi coordinates)
        const defaultCoords = [67.0011, 24.8607];
        const updatedRide = await Ride.findByIdAndUpdate(
          ride._id,
          { 
            'emergencyLocation.coordinates': defaultCoords,
            'emergencyLocation.address': `Fixed location (original was invalid: [${longitude}, ${latitude}])`
          },
          { new: true }
        );
        
        console.log(`✅ Fixed ride ${ride._id} with default coordinates: ${defaultCoords}`);
        fixedCount++;
        continue; // Skip geocoding since we already fixed it
      }
      
      // Coordinates are valid (or have been fixed), use reverse geocoding to validate/update address
      try {
        const apiKey = process.env.GOOGLE_MAP_API;
        if (!apiKey) {
          console.warn('Google Maps API key not found. Skipping reverse geocoding validation.');
          alreadyValidCount++;
          continue;
        }
        
        // Use Google Maps API for reverse geocoding (note: we pass latitude, longitude - Google API order)
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
        const response = await axios.get(url);
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const formattedAddress = response.data.results[0].formatted_address;
          
          // Update the address if it's different
          if (formattedAddress !== ride.emergencyLocation.address) {
            await Ride.findByIdAndUpdate(
              ride._id,
              { 'emergencyLocation.address': formattedAddress },
              { new: true }
            );
            console.log(`✅ Updated address for ride ${ride._id}: ${formattedAddress}`);
            fixedCount++;
          } else {
            console.log(`✓ Ride ${ride._id} already has correct address`);
            alreadyValidCount++;
          }
        } else {
          console.warn(`Could not validate location for ride ${ride._id}: ${response.data.status}`);
          alreadyValidCount++; // Count as valid since coordinates are in range
        }
      } catch (error) {
        console.error(`Error validating location for ride ${ride._id}:`, error);
        failedCount++;
      }
    }

    console.log(`\nLocation validation complete:
- Fixed: ${fixedCount} rides
- Already valid: ${alreadyValidCount} rides
- Failed: ${failedCount} rides`);

  } catch (error) {
    console.error('Error fixing locations:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
} 