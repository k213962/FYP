const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const BlacklistToken = require('../models/blacklistToken.model');

dotenv.config();

module.exports = async function (req, res, next) {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Access Denied" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const blacklisted = await BlacklistToken.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({ message: "Token expired. Please log in again." });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid Token" });
    }
};