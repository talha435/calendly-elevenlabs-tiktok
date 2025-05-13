// src/middleware/adminAuth.js
const config = require('../config/environment');

/**
 * Basic authentication middleware specifically for admin pages.
 * Requires password-based authentication for protected routes.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
function adminAuth(req, res, next) {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
        return res.status(401).send('Authentication required');
    }
    
    // Parse Basic Auth header
    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    const username = auth[0];
    const password = auth[1];
    
    // Check the password (username can be anything)
    if (password === config.adminPassword) {
        return next();
    }
    
    // Auth failed
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
    return res.status(401).send('Authentication failed');
}

module.exports = adminAuth;