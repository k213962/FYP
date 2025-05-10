// controllers/map.controller.js
const mapService = require('../services/map.service');
const { validationResult } = require('express-validator');

exports.getCoordinates = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { address } = req.query;
        const coordinates = await mapService.getAddressCoordinates(address);
        return res.status(200).json(coordinates);
    } catch (error) {
        console.error('Error fetching coordinates:', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getDistanceAndTime = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { origin, destination } = req.query;
        const result = await mapService.getDistanceAndTime(origin, destination);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching distance and time:', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getSuggestions = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { address } = req.query;
        const suggestions = await mapService.getAddressSuggestions(address);
        return res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}; 