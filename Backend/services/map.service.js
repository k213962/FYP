const axios = require('axios');
require('dotenv').config(); // Add this if it's not already loaded in this file or globally

exports.getAddressCoordinates = async (address) => {
    try {
        const apiKey = process.env.GOOGLE_Map_API; // Replace with your Google Maps API key
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        
        const response = await axios.get(url);
        
        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return {
                latitude: location.lat,
                longitude: location.lng
            };
        } else {
            throw new Error(`Geocoding failed: ${response.data.status}`);
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error.message);
        throw error;
    }
};
exports.getDistanceAndTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    try {
        const apiKey = process.env.GOOGLE_Map_API; // Replace with your Google Maps API key
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
        
        const response = await axios.get(url);

        if (response.data.status === 'OK') {
            const rows = response.data.rows;
            if (!rows || rows.length === 0 || !rows[0].elements || rows[0].elements.length === 0) {
                throw new Error('No route found or invalid response from the API');
            }

            const element = rows[0].elements[0];
            if (element.status === 'OK') {
                return {
                    distance: element.distance.text,
                    duration: element.duration.text
                };
            } else {
                throw new Error(`Distance Matrix API failed: ${element.status}`);
            }
        } else {
            throw new Error(`Distance Matrix API error: ${response.data.status}`);
        }
    } catch (error) {
        console.error('Error fetching distance and time:', error.message);
        throw error;
    }
};

exports.getAddressSuggestions = async (address) => {
    if(!address) {
        throw new Error('Address is required');
    }
    const apiKey = process.env.GOOGLE_Map_API; // Replace with your Google Maps API key         
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&key=${apiKey}`;
        
    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            return response.data.predictions;
        }   else {
            throw new Error(`unable to getch suggestion: ${response.data.status}`);
        }
    }
    catch (error) {
        console.error('Error fetching suggestions:', error.message);
        throw error;
    }
}
