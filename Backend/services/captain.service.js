const Captain = require('../models/captain.model');
const NodeGeocoder = require('node-geocoder');
const bcrypt = require('bcryptjs');

// Initialize geocoder with OpenStreetMap provider
const options = {
    provider: 'openstreetmap'
};
const geocoder = NodeGeocoder(options);

// Helper function to get address from coordinates
const getAddressFromCoordinates = async (coordinates) => {
    try {
        const [longitude, latitude] = coordinates;
        const results = await geocoder.reverse({ lat: latitude, lon: longitude });
        if (results && results.length > 0) {
            return results[0].formattedAddress;
        }
        return 'Address not found';
    } catch (error) {
        console.error('Error getting address:', error);
        return 'Error fetching address';
    }
};

exports.createCaptain = async (captainData) => {
    const captain = new Captain(captainData);
    await captain.save();
    return captain;
};

// Example of a service to find a captain by email
exports.findCaptainByEmail = async (email) => {
    return await Captain.findOne({ email });
};

exports.loginCaptain = async (email, password) => {
    try {
        console.log(`\nAttempting login for captain with email: ${email}`);
        
        // Find captain by email
        const captain = await Captain.findOne({ email });
        if (!captain) {
            console.log('Login failed: Captain not found');
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, captain.password);
        if (!isPasswordValid) {
            console.log('Login failed: Invalid password');
            throw new Error('Invalid email or password');
        }

        // Get current location and address if available
        let locationInfo = 'No location data';
        if (captain.location && captain.location.coordinates) {
            const coordinateString = formatCoordinatesAsString(captain.location.coordinates);
            const address = await getAddressFromCoordinates(captain.location.coordinates);
            locationInfo = `\nCurrent Location:\nCoordinates: ${coordinateString}\nAddress: ${address}`;
        }

        console.log(`\nLogin successful for captain: ${captain._id}`);
        console.log(`Name: ${captain.name}`);
        console.log(`Email: ${captain.email}`);
        console.log(`Status: ${captain.status}`);
        console.log(`Vehicle Type: ${captain.vehicleType}`);
        console.log(locationInfo);

        // Update last login timestamp
        await Captain.findByIdAndUpdate(captain._id, {
            lastLogin: new Date()
        });

        return captain;
    } catch (error) {
        console.error('Login error:', error.message);
        throw error;
    }
};

exports.updateCaptainStatus = async (captainId, status) => {
    try {
        // Validate status
        const validStatuses = ['available', 'busy', 'offline', 'online'];
        if (!validStatuses.includes(status.toLowerCase())) {
            throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Update captain status
        const updatedCaptain = await Captain.findByIdAndUpdate(
            captainId,
            {
                $set: {
                    status: status.toLowerCase(),
                    lastStatusUpdate: new Date()
                }
            },
            { new: true }
        );

        if (!updatedCaptain) {
            throw new Error('Captain not found');
        }

        console.log(`✅ Captain ${captainId} status updated to ${status}`);
        return updatedCaptain;

    } catch (error) {
        console.error('Error updating captain status:', error);
        throw error;
    }
};

exports.getCurrentLocation = async (captainId) => {
    try {
        console.log(`\nFetching current location for captain ${captainId}`);
        
        const captain = await Captain.findById(captainId);
        if (!captain) {
            console.log('Error: Captain not found');
            throw new Error('Captain not found');
        }

        if (!captain.location || !captain.location.coordinates) {
            console.log('No location data available for captain');
            return null;
        }

        const coordinateString = formatCoordinatesAsString(captain.location.coordinates);
        const address = await getAddressFromCoordinates(captain.location.coordinates);
        
        console.log('\nCurrent Location Details:');
        console.log('------------------------');
        console.log(`Captain ID: ${captain._id}`);
        console.log(`Name: ${captain.name}`);
        console.log(`Status: ${captain.status}`);
        console.log(`Coordinates: ${coordinateString}`);
        console.log(`Address: ${address}`);
        console.log(`Last Updated: ${captain.location.lastUpdated}`);
        console.log('------------------------\n');

        return {
            coordinates: captain.location.coordinates,
            address: address,
            lastUpdated: captain.location.lastUpdated
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        throw error;
    }
};

exports.updateCaptainLocation = async (captainId, location) => {
    try {
        // Validate location format
        if (!location.type || location.type !== 'Point') {
            throw new Error('Invalid location type');
        }
        if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            throw new Error('Invalid location coordinates');
        }

        // Validate coordinate ranges
        const [longitude, latitude] = location.coordinates;
        if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
            throw new Error('Invalid coordinate ranges');
        }

        // Check if captain is online
        const captain = await Captain.findById(captainId);
        if (!captain) {
            throw new Error('Captain not found');
        }

        if (captain.status !== 'Online') {
            throw new Error('Captain must be online to update location');
        }

        // Format coordinates as string for logging
        const coordinateString = formatCoordinatesAsString(location.coordinates);
        console.log(`\nUpdating captain ${captainId} location:`);
        console.log('------------------------');
        console.log(`Previous Location:`);
        if (captain.location && captain.location.coordinates) {
            const prevCoordinateString = formatCoordinatesAsString(captain.location.coordinates);
            const prevAddress = await getAddressFromCoordinates(captain.location.coordinates);
            console.log(`Coordinates: ${prevCoordinateString}`);
            console.log(`Address: ${prevAddress}`);
        } else {
            console.log('No previous location data');
        }
        console.log('------------------------');
        console.log(`New Location:`);
        console.log(`Coordinates: ${coordinateString}`);

        // Get and log address
        const address = await getAddressFromCoordinates(location.coordinates);
        console.log(`Address: ${address}`);
        console.log('------------------------\n');

        // Update location
        const updatedCaptain = await Captain.findByIdAndUpdate(
            captainId,
            {
                $set: {
                    location: {
                        type: location.type,
                        coordinates: location.coordinates,
                        lastUpdated: new Date(),
                        address: address
                    }
                }
            },
            { new: true }
        );

        console.log(`Successfully updated captain ${captainId} location`);
        return updatedCaptain;
    } catch (error) {
        console.error('Error updating captain location:', error);
        throw error;
    }
};

// Helper function to validate coordinates
const validateCoordinates = (coordinates) => {
    // Check if coordinates is a string
    if (typeof coordinates === 'string') {
        try {
            // Try to parse the string as coordinates
            const [longitude, latitude] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
            return !isNaN(longitude) && !isNaN(latitude) &&
                   longitude >= -180 && longitude <= 180 && 
                   latitude >= -90 && latitude <= 90;
        } catch (error) {
            return false;
        }
    }
    
    // Check if coordinates is an array
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return false;
    }
    
    const [longitude, latitude] = coordinates;
    return !isNaN(longitude) && !isNaN(latitude) &&
           longitude >= -180 && longitude <= 180 && 
           latitude >= -90 && latitude <= 90;
};

// Helper function to fix invalid coordinates
const fixCoordinates = (coordinates) => {
    // If coordinates is a string, try to parse it
    if (typeof coordinates === 'string') {
        try {
            const [longitude, latitude] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(longitude) && !isNaN(latitude)) {
                return [
                    Math.max(-180, Math.min(180, longitude)), // Clamp longitude
                    Math.max(-90, Math.min(90, latitude))     // Clamp latitude
                ];
            }
        } catch (error) {
            console.error('Error parsing coordinates string:', error);
            return null;
        }
    }
    
    // If coordinates is an array
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        console.error('Invalid coordinates format');
        return null;
    }
    
    const [longitude, latitude] = coordinates;
    if (isNaN(longitude) || isNaN(latitude)) {
        console.error('Invalid coordinate values');
        return null;
    }
    
    return [
        Math.max(-180, Math.min(180, longitude)), // Clamp longitude
        Math.max(-90, Math.min(90, latitude))     // Clamp latitude
    ];
};

// Helper function to format coordinates as string
const formatCoordinatesAsString = (coordinates) => {
    if (typeof coordinates === 'string') {
        return coordinates;
    }
    if (Array.isArray(coordinates) && coordinates.length === 2) {
        return `${coordinates[0]},${coordinates[1]}`;
    }
    return '74.3587,31.5204'; // Default to Lahore
};

exports.validateAllCaptainLocations = async () => {
    try {
        const captains = await Captain.find({});
        const results = {
            total: captains.length,
            valid: 0,
            fixed: 0,
            invalid: 0,
            details: []
        };

        console.log(`\nValidating locations for ${captains.length} captains...`);

        for (const captain of captains) {
            const location = captain.location;
            const result = {
                captainId: captain._id,
                email: captain.email,
                status: captain.status,
                originalLocation: location ? { ...location.toObject() } : null
            };

            if (!location || !location.coordinates) {
                result.status = 'invalid';
                result.message = 'Missing location or coordinates';
                console.log(`\nCaptain ${captain._id}: Missing location or coordinates`);
                results.invalid++;
            } else if (!validateCoordinates(location.coordinates)) {
                // Fix invalid coordinates
                const fixedCoordinates = fixCoordinates(location.coordinates);
                const formattedCoordinates = formatCoordinatesAsString(fixedCoordinates);
                
                console.log(`\nCaptain ${captain._id}: Fixed invalid coordinates`);
                console.log(`Original coordinates: ${formatCoordinatesAsString(location.coordinates)}`);
                console.log(`Fixed coordinates: ${formattedCoordinates}`);
                
                // Get and log address for fixed coordinates
                const address = await getAddressFromCoordinates(fixedCoordinates);
                console.log(`Address: ${address}`);
                
                await Captain.findByIdAndUpdate(captain._id, {
                    $set: {
                        'location.coordinates': fixedCoordinates,
                        'location.lastUpdated': new Date(),
                        'location.address': address
                    }
                });
                
                result.status = 'fixed';
                result.message = 'Fixed invalid coordinates';
                result.fixedCoordinates = fixedCoordinates;
                result.formattedCoordinates = formattedCoordinates;
                result.address = address;
                results.fixed++;
            } else {
                result.status = 'valid';
                result.message = 'Valid coordinates';
                result.formattedCoordinates = formatCoordinatesAsString(location.coordinates);
                
                // Get and log address for valid coordinates
                const address = await getAddressFromCoordinates(location.coordinates);
                console.log(`\nCaptain ${captain._id}: Valid coordinates`);
                console.log(`Coordinates: ${result.formattedCoordinates}`);
                console.log(`Address: ${address}`);
                
                // Update address in database
                await Captain.findByIdAndUpdate(captain._id, {
                    $set: {
                        'location.address': address
                    }
                });
                
                result.address = address;
                results.valid++;
            }

            results.details.push(result);
        }

        console.log('\nValidation Summary:');
        console.log(`Total captains: ${results.total}`);
        console.log(`Valid locations: ${results.valid}`);
        console.log(`Fixed locations: ${results.fixed}`);
        console.log(`Invalid locations: ${results.invalid}`);

        return results;
    } catch (error) {
        console.error('Error validating captain locations:', error);
        throw error;
    }
};

exports.getCaptainLocation = async (captainId) => {
    try {
        const captain = await Captain.findById(captainId);
        if (!captain) {
            throw new Error('Captain not found');
        }

        // Validate and fix coordinates if needed
        if (captain.location && captain.location.coordinates) {
            if (!validateCoordinates(captain.location.coordinates)) {
                const fixedCoordinates = fixCoordinates(captain.location.coordinates);
                const formattedCoordinates = formatCoordinatesAsString(fixedCoordinates);
                
                await Captain.findByIdAndUpdate(captainId, {
                    $set: {
                        'location.coordinates': fixedCoordinates,
                        'location.lastUpdated': new Date()
                    }
                });
                
                captain.location.coordinates = fixedCoordinates;
                captain.location.formattedCoordinates = formattedCoordinates;
            } else {
                captain.location.formattedCoordinates = formatCoordinatesAsString(captain.location.coordinates);
            }
        }

        return captain.location;
    } catch (error) {
        console.error('Error getting captain location:', error);
        throw error;
    }
};

exports.getOnlineCaptains = async () => {
    try {
        return await Captain.find({ 
            status: 'Online',
            location: { $exists: true }
        }).select('location vehicleType');
    } catch (error) {
        console.error('Error getting online captains:', error);
        throw error;
    }
};

exports.startLocationTracking = async (captainId, locationData) => {
    try {
        console.log(`\nStarting location tracking for captain ${captainId}`);
        
        const captain = await Captain.findById(captainId);
        if (!captain) {
            console.log('Error: Captain not found');
            throw new Error('Captain not found');
        }

        if (captain.status !== 'Online') {
            console.log('Error: Captain must be online to track location');
            throw new Error('Captain must be online to track location');
        }

        // Validate and update initial location
        if (!locationData.coordinates || locationData.coordinates.length !== 2) {
            console.log('Error: Invalid location coordinates');
            throw new Error('Invalid location coordinates');
        }

        const [longitude, latitude] = locationData.coordinates;
        if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
            console.log('Error: Invalid coordinate ranges');
            throw new Error('Invalid coordinate ranges');
        }

        const coordinateString = formatCoordinatesAsString(locationData.coordinates);
        const address = await getAddressFromCoordinates(locationData.coordinates);

        console.log('\nInitial Location:');
        console.log('------------------------');
        console.log(`Coordinates: ${coordinateString}`);
        console.log(`Address: ${address}`);
        console.log('------------------------\n');

        await this.updateCaptainLocation(captainId, locationData);

        return { 
            message: 'Location tracking started',
            initialLocation: {
                coordinates: locationData.coordinates,
                address: address
            }
        };
    } catch (error) {
        console.error('Error starting location tracking:', error);
        throw error;
    }
};

/**
 * Get captain by ID
 * @param {string} captainId - Captain ID
 */
exports.getCaptainById = async (captainId) => {
    try {
        const captain = await Captain.findById(captainId);
        return captain;
    } catch (error) {
        console.error(`Error getting captain ${captainId}:`, error);
        return null;
    }
};

/**
 * Update captain status
 * @param {string} captainId - Captain ID
 * @param {string} status - New status ('Online' or 'Offline')
 */
exports.updateCaptainStatus = async (captainId, status) => {
    try {
        if (status !== 'Online' && status !== 'Offline') {
            throw new Error('Invalid status. Status should be either Online or Offline');
        }

        const captain = await Captain.findByIdAndUpdate(
            captainId,
            { status },
            { new: true }
        );

        if (!captain) {
            throw new Error('Captain not found');
        }

        return captain;
    } catch (error) {
        console.error(`Error updating captain ${captainId} status:`, error);
        throw error;
    }
};

/**
 * Update captain location
 * @param {string} captainId - Captain ID
 * @param {Object} location - Location object with latitude and longitude
 */
exports.updateCaptainLocation = async (captainId, location) => {
    try {
        if (!location || !location.latitude || !location.longitude) {
            throw new Error('Invalid location data');
        }

        // Format the location as a GeoJSON Point
        const geoJSONLocation = {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
            lastUpdated: new Date()
        };

        const captain = await Captain.findByIdAndUpdate(
            captainId,
            { location: geoJSONLocation },
            { new: true }
        );

        if (!captain) {
            throw new Error('Captain not found');
        }

        return captain;
    } catch (error) {
        console.error(`Error updating captain ${captainId} location:`, error);
        throw error;
    }
};

/**
 * Get captain location
 * @param {string} captainId - Captain ID
 */
exports.getCaptainLocation = async (captainId) => {
    try {
        const captain = await Captain.findById(captainId).select('location');
        
        if (!captain) {
            throw new Error('Captain not found');
        }

        return captain.location;
    } catch (error) {
        console.error(`Error getting captain ${captainId} location:`, error);
        throw error;
    }
};

/**
 * Get online captains
 * @param {string} vehicleType - Optional vehicle type filter
 */
exports.getOnlineCaptains = async (vehicleType = null) => {
    try {
        let query = { status: 'Online' };
        
        if (vehicleType) {
            query.vehicleType = vehicleType;
        }
        
        const captains = await Captain.find(query)
            .select('_id fullname phone vehicleType vehicleNoPlate location');
            
        return captains;
    } catch (error) {
        console.error('Error getting online captains:', error);
        throw error;
    }
};

/**
 * Start location tracking for a captain
 * @param {string} captainId - Captain ID
 * @param {Object} location - Initial location
 */
exports.startLocationTracking = async (captainId, location) => {
    try {
        if (!location || !location.latitude || !location.longitude) {
            throw new Error('Invalid location data');
        }

        // Format the location as a GeoJSON Point
        const geoJSONLocation = {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
            lastUpdated: new Date()
        };

        const captain = await Captain.findByIdAndUpdate(
            captainId,
            { 
                location: geoJSONLocation,
                trackingStarted: new Date(),
                isTracking: true
            },
            { new: true }
        );

        if (!captain) {
            throw new Error('Captain not found');
        }

        return {
            message: 'Location tracking started',
            captain: {
                id: captain._id,
                location: captain.location
            }
        };
    } catch (error) {
        console.error(`Error starting location tracking for captain ${captainId}:`, error);
        throw error;
    }
};

/**
 * Validate all captain locations to ensure data consistency
 */
exports.validateAllCaptainLocations = async () => {
    try {
        const captains = await Captain.find();
        const results = {
            total: captains.length,
            valid: 0,
            fixed: 0,
            invalid: 0,
            details: []
        };

        for (const captain of captains) {
            const detail = {
                captainId: captain._id,
                email: captain.email,
                status: 'valid',
                message: 'Location is valid',
                originalLocation: captain.location
            };

            if (!captain.location || !captain.location.coordinates) {
                detail.status = 'invalid';
                detail.message = 'No location data';
                results.invalid++;
            } else {
                const [lng, lat] = captain.location.coordinates;
                
                if (typeof lng !== 'number' || typeof lat !== 'number') {
                    detail.status = 'invalid';
                    detail.message = 'Coordinates are not numbers';
                    results.invalid++;
                } else if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
                    detail.status = 'fixed';
                    detail.message = 'Coordinates out of valid range, reset to default';
                    detail.fixedCoordinates = [67.0011, 24.8607]; // Default to Karachi
                    
                    // Fix the captain location
                    captain.location = {
                        type: 'Point',
                        coordinates: [67.0011, 24.8607],
                        lastUpdated: new Date()
                    };
                    await captain.save();
                    
                    results.fixed++;
                } else {
                    results.valid++;
                }
            }
            
            results.details.push(detail);
        }

        return results;
    } catch (error) {
        console.error('Error validating captain locations:', error);
        throw error;
    }
}