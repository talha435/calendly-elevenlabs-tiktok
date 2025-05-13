const config = require('../config/environment');

/**
 * Unified authentication middleware that supports API Key (X-API-Key header)
 * or Basic Auth (using the admin password).
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const authenticateApiKey = (req, res, next) => {
  // Option 1: Check for API Key
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === config.apiKey) {
    return next();
  }
  
  // Option 2: Check for Basic Auth
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      // Parse Basic Auth credentials
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [, password] = credentials.split(':');
      
      if (password === config.adminPassword) {
        console.log('Authentication successful via Basic Auth');
        return next();
      }
    } catch (error) {
      console.error('Error parsing Basic Auth:', error);
    }
  }
  
  // If we reach here, authentication failed
  console.log('Authentication failed - invalid credentials');
  return res.status(401).json({ 
    error: 'Unauthorized', 
    message: 'Valid authentication required' 
  });
};

/**
 * Middleware for protecting admin pages with Basic Authentication.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
    return res.status(401).send('Authentication required');
  }
  
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [, password] = credentials.split(':');
    
    if (password === config.adminPassword) {
      return next();
    }
  } catch (error) {
    console.error('Error parsing Basic Auth:', error);
  }
  
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin Access"');
  return res.status(401).send('Authentication failed');
};

module.exports = {
  authenticateApiKey,
  adminAuth
};