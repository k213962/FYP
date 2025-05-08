const express=require('express');
const router=express.Router();

const mapController = require('../controllers/map.controller');

const auth = require('../middlewares/auth.middleware');
const {query} = require('express-validator');

router.get('/getCoordinates',
    query('address').notEmpty().withMessage('Address is required'),
    mapController.getCoordinates);


router.get('/get-distance-time',
    query('origin').notEmpty().withMessage('Origin is required'),
    query('destination').notEmpty().withMessage('Destination is required'),
    mapController.getDistanceAndTime);
router.get('/get-suggestions',
    query('address').notEmpty().withMessage('Address is required'),
    mapController.getSuggestions);


module.exports = router;
 