const rideModel = require('../models/ride.model');
const Captain = require('../models/captain.model');

module.exports.createRide = async (userId, emergencyData) => {
    const { emergencyLocation, serviceType, emergencyType, description } = emergencyData;

    // Log the received data for debugging
    console.log('Creating emergency request with data:', {
        userId,
        emergencyLocation,
        serviceType,
        emergencyType,
        description
    });

    // Validate required fields
    if (!userId) throw new Error('User ID is required');
    if (!emergencyLocation) throw new Error('Emergency location is required');
    if (!serviceType) throw new Error('Service type is required');
    if (!emergencyType) throw new Error('Emergency type is required');
    if (!description) throw new Error('Description is required');

    // Validate and correct the emergency location if needed
    const validatedLocation = await validateAndFixEmergencyLocation(emergencyLocation);

    // Validate service type
    const validServiceTypes = ['ambulance', 'fire', 'police'];
    if (!validServiceTypes.includes(serviceType)) {
        throw new Error(`Invalid service type. Must be one of: ${validServiceTypes.join(', ')}`);
    }

    try {
        const ride = await rideModel.create({
            user: userId,
            emergencyLocation: {
                type: validatedLocation.type,
                coordinates: validatedLocation.coordinates,
                address: validatedLocation.address
            },
            serviceType,
            emergencyType,
            description,
            status: 'pending',
            createdAt: new Date()
        });

        console.log('Emergency request created successfully:', ride);
        return ride;
    } catch (error) {
        console.error('Error creating emergency request:', error);
        throw error;
    }
};

// Helper function to validate and fix emergency location coordinates
async function validateAndFixEmergencyLocation(location) {
    try {
        // Basic validation for coordinates format
        if (!location.type || location.type !== 'Point') {
            throw new Error('Invalid emergency location type');
        }
        if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            throw new Error('Invalid emergency location coordinates');
        }

        // Copy coordinates to avoid mutating the original
        const coordinates = [...location.coordinates];
        let [longitude, latitude] = coordinates;
        
        // Check if coordinates might be swapped (latitude first, longitude second)
        // Pakistan coordinates should have longitude around 67-77 and latitude around 24-37
        if (longitude >= 20 && longitude <= 40 && latitude >= 60 && latitude <= 80) {
            console.warn(`Coordinates appear to be swapped: [${longitude}, ${latitude}]. Fixing order...`);
            // Swap the coordinates
            [longitude, latitude] = [latitude, longitude];
            coordinates[0] = longitude;
            coordinates[1] = latitude;
        }
        
        // Check if coordinates are within valid ranges
        if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
            console.warn(`Invalid coordinates detected: [${longitude}, ${latitude}]. Will attempt to fix.`);
            
            // Default to a safe location (e.g., city center) if coordinates are invalid
            // These are Karachi coordinates as an example - update to your default city
            return {
                type: 'Point',
                coordinates: [67.0011, 24.8607], // Karachi coordinates
                address: location.address || 'Default Location (Coordinates were invalid)'
            };
        }
        
        // Use Google Maps API to validate and get proper address
        const axios = require('axios');
        const apiKey = process.env.GOOGLE_MAP_API;
        
        if (!apiKey) {
            console.warn('Google Maps API key not found. Skipping reverse geocoding validation.');
            return {
                type: 'Point',
                coordinates: coordinates, // Use the potentially fixed coordinates
                address: location.address
            };
        }
        
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
        const response = await axios.get(url);
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const formattedAddress = response.data.results[0].formatted_address;
            console.log(`✅ Validated location: ${formattedAddress}`);
            
            return {
                type: 'Point',
                coordinates: coordinates, // Use the potentially fixed coordinates
                address: formattedAddress
            };
        } else {
            console.warn(`Could not validate location: ${response.data.status}`);
            return {
                type: 'Point',
                coordinates: coordinates, // Use the potentially fixed coordinates
                address: location.address
            };
        }
    } catch (error) {
        console.error('Error validating location:', error);
        // Return original location if validation fails
        return location;
    }
}

module.exports.findNearbyDrivers = async (emergencyLocation, serviceType, emergencyType = null, maxDistance = 20, limit = 10) => {
    // Convert service type to match captain's vehicleType
    let vehicleType = serviceType;
    if (serviceType === 'fire brigade') {
        vehicleType = 'fire';
    }

    // Make sure coordinates are in the correct order [longitude, latitude]
    // This ensures compatibility with GeoJSON format expected by MongoDB
    const coordinates = [...emergencyLocation.coordinates];
    
    // Check if coordinates might be in wrong order (latitude, longitude)
    // Pakistan coordinates should have longitude around 67-77 and latitude around 24-37
    const [firstCoord, secondCoord] = coordinates;
    
    // If first coordinate looks like latitude (around 24-37 for Pakistan)
    // and second looks like longitude (around 67-77 for Pakistan)
    if (firstCoord >= 20 && firstCoord <= 40 && secondCoord >= 60 && secondCoord <= 80) {
        console.log('⚠️ Coordinates appear to be in wrong order [lat, lng]. Swapping them...');
        // Swap coordinates to correct order [longitude, latitude]
        coordinates.reverse();
    }

    console.log(`\n🔍 Finding nearby drivers for ${serviceType} emergency:
----------------------------------------
Emergency Type: ${emergencyType || 'Not specified'}
Original Location: [${emergencyLocation.coordinates.join(', ')}]
Corrected Location: [${coordinates.join(', ')}]
Address: ${emergencyLocation.address || 'Not provided'}
Max Distance: ${maxDistance} km
Limit: ${limit} drivers
Vehicle Type Filter: ${vehicleType}
----------------------------------------`);

    try {
        // First check if there are any online captains at all
        const onlineCaptainCount = await Captain.countDocuments({ status: 'Online' });
        console.log(`Total online captains (any type): ${onlineCaptainCount}`);
        
        // Check if there are online captains of the right vehicle type
        const rightTypeCaptainCount = await Captain.countDocuments({ 
            status: 'Online',
            vehicleType: vehicleType
        });
        console.log(`Online captains with vehicle type '${vehicleType}': ${rightTypeCaptainCount}`);
        
        // Check if any captains have valid location data
        const captainsWithLocationCount = await Captain.countDocuments({
            status: 'Online',
            'location.coordinates.0': { $exists: true },
            'location.coordinates.1': { $exists: true }
        });
        console.log(`Online captains with valid location data: ${captainsWithLocationCount}`);

        // Log the first few online captains to debug their locations
        const sampleCaptains = await Captain.find({ status: 'Online' })
            .select('_id fullname phone vehicleType location')
            .limit(3);
            
        if (sampleCaptains.length > 0) {
            console.log('Sample online captains:');
            sampleCaptains.forEach((captain, index) => {
                console.log(`${index + 1}. ${captain.fullname ? captain.fullname.firstname : 'Unknown'} - Vehicle: ${captain.vehicleType} - Location: ${captain.location ? JSON.stringify(captain.location.coordinates) : 'No location'}`);
            });
        }

        // Build query - always check for online status and location
        const query = {
            status: 'Online',
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    },
                    $maxDistance: maxDistance * 1000 // Convert km to meters
                }
            }
        };

        // Add vehicleType to query if specified
        if (vehicleType) {
            query.vehicleType = vehicleType;
        }

        console.log('MongoDB query:', JSON.stringify(query, null, 2));

        // Try a simpler location query to see if any captains are within range
        const baseCaptainsNearby = await Captain.find(query)
            .select('_id fullname phone vehicleType vehicleNoPlate location rating')
            .limit(limit);
        
        console.log(`Captains nearby (without vehicle type filter): ${baseCaptainsNearby.length}`);

        // Find drivers matching the criteria
        const drivers = await Captain.find(query)
            .select('_id fullname phone vehicleType vehicleNoPlate location rating')
            .limit(limit);

        // Calculate and add distance for each driver
        const driversWithDistance = drivers.map(driver => {
            // Calculate distance using MongoDB's $near results (already sorted by distance)
            const distanceInMeters = calculateDistance(
                coordinates[1], // latitude (from corrected coordinates)
                coordinates[0], // longitude (from corrected coordinates)
                driver.location.coordinates[1],   // driver latitude
                driver.location.coordinates[0]    // driver longitude
            );
            
            return {
                _id: driver._id,
                fullname: driver.fullname,
                phone: driver.phone,
                vehicleType: driver.vehicleType,
                vehicleNoPlate: driver.vehicleNoPlate,
                rating: driver.rating || 0,
                distanceInKm: (distanceInMeters / 1000).toFixed(2),
                estimatedArrivalTime: `${Math.ceil(distanceInMeters/1000 * 2)} mins` // Rough estimate: 2 min per km
            };
        });

        console.log(`✅ Found ${driversWithDistance.length} nearby drivers for the emergency`);
        if (driversWithDistance.length > 0) {
            console.log('Top 3 nearest drivers:');
            driversWithDistance.slice(0, 3).forEach((driver, index) => {
                console.log(`${index + 1}. ${driver.fullname?.firstname || 'Unknown'} - ${driver.distanceInKm} km away - ${driver.vehicleType}`);
            });
        } else {
            console.log('⚠️ No drivers found for this emergency type in the specified radius');
            if (baseCaptainsNearby.length > 0) {
                console.log(`NOTE: Found ${baseCaptainsNearby.length} captains nearby without vehicle type filter`);
            }
        }

        return driversWithDistance;
    } catch (error) {
        console.error('❌ Error finding nearby drivers:', error);
        throw error;
    }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in meters
    return distance;
}

// Add new method to get nearby pending rides for a captain
module.exports.getNearbyPendingRides = async (longitude, latitude, maxDistance = 5, captainVehicleType = null) => {
    try {
        console.log(`Finding pending rides near [${longitude}, ${latitude}] for ${captainVehicleType || 'any'} vehicle type`);
        
        // Basic validation
        if (!longitude || !latitude) {
            console.error('Invalid coordinates provided');
            return [];
        }
        
        // Build query for pending rides
        const query = {
            status: 'pending',
            'emergencyLocation.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: maxDistance * 1000 // Convert km to meters
                }
            }
        };
        
        // Add service type filter if captain's vehicle type is specified
        if (captainVehicleType) {
            // Convert vehicle type to service type if needed
            let serviceType = captainVehicleType;
            query.serviceType = serviceType;
        }
        
        console.log('Searching for pending rides with query:', JSON.stringify(query, null, 2));
        
        // Find pending rides matching the criteria
        const pendingRides = await rideModel.find(query)
            .select('_id user emergencyLocation emergencyType serviceType description status createdAt')
            .populate('user', 'firstname lastname phone email')
            .limit(10); // Limit to 10 rides
        
        console.log(`Found ${pendingRides.length} pending rides nearby`);
        
        // Calculate and add distance for each ride
        const ridesWithDistance = pendingRides.map(ride => {
            const distanceInKm = calculateDistance(
                latitude, // captain latitude
                longitude, // captain longitude
                ride.emergencyLocation.coordinates[1], // ride latitude
                ride.emergencyLocation.coordinates[0]  // ride longitude
            ) / 1000; // Convert meters to km
            
            return {
                ...ride.toObject(),
                distance: parseFloat(distanceInKm.toFixed(2))
            };
        });
        
        // Sort by distance (closest first)
        ridesWithDistance.sort((a, b) => a.distance - b.distance);
        
        return ridesWithDistance;
    } catch (error) {
        console.error('Error finding nearby pending rides:', error);
        return [];
    }
};

module.exports.getRideById = async (rideId) => {
    try {
        const ride = await rideModel.findById(rideId)
            .populate('user', 'firstname lastname phone email mobile')
            .populate('captain', 'firstname lastname phone vehicleType vehicleNoPlate location');
        
        if (!ride) {
            console.warn(`No ride found with ID ${rideId}`);
            return null;
        }

        console.log(`Found ride ${rideId} with user data:`, {
            userId: ride.user?._id,
            userName: ride.user ? `${ride.user.firstname || ''} ${ride.user.lastname || ''}`.trim() : 'Anonymous',
            userPhone: ride.user?.mobile
        });
        
        return ride;
    } catch (error) {
        console.error(`Error getting ride ${rideId}:`, error);
        return null;
    }
};

module.exports.acceptRide = async (rideId, captainId) => {
    try {
        console.log(`Captain ${captainId} attempting to accept ride ${rideId}`);
        
        // Check if ride exists and is still pending
        const ride = await rideModel.findById(rideId);
        
        if (!ride) {
            throw new Error('Ride not found');
        }
        
        if (ride.status !== 'pending') {
            throw new Error(`Ride has already been ${ride.status}`);
        }
        
        // Update ride status and assign captain
        const updatedRide = await rideModel.findByIdAndUpdate(
            rideId,
            {
                status: 'accepted',
                captain: captainId,
                acceptedAt: new Date()
            },
            { new: true }
        ).populate('user', 'firstname lastname phone email')
          .populate('captain', 'firstname lastname phone vehicleType vehicleNoPlate');
        
        console.log(`Ride ${rideId} accepted by captain ${captainId}`);
        
        return updatedRide;
    } catch (error) {
        console.error(`Error accepting ride ${rideId}:`, error);
        throw error;
    }
};

module.exports.startRide = async (rideId, captainId) => {
    try {
        // Check if ride exists and is accepted by this captain
        const ride = await rideModel.findOne({
            _id: rideId,
            captain: captainId,
            status: 'accepted'
        });
        
        if (!ride) {
            throw new Error('Ride not found or not accepted yet');
        }
        
        // Update ride status
        const updatedRide = await rideModel.findByIdAndUpdate(
            rideId,
            {
                status: 'in_progress',
                startedAt: new Date()
            },
            { new: true }
        ).populate('user', 'firstname lastname phone email')
          .populate('captain', 'firstname lastname phone vehicleType vehicleNoPlate');
        
        console.log(`Ride ${rideId} started by captain ${captainId}`);
        
        return updatedRide;
    } catch (error) {
        console.error(`Error starting ride ${rideId}:`, error);
        throw error;
    }
};
