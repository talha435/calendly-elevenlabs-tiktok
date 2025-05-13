// src/utils/secure-logging.js

/**
 * Sanitizes sensitive data in objects before logging.
 * Removes tokens, passwords, and other sensitive information.
 * 
 * @param {Array} args - Arguments to sanitize
 * @returns {Array} Sanitized arguments
 */
function sanitizeArgs(args) {
  return args.map(arg => {
    if (typeof arg !== 'object' || arg === null) return arg;
    
    // Create a copy to avoid modifying the original
    const sanitized = { ...arg };
    
    // List of sensitive field keywords to redact
    const sensitiveFields = ['token', 'apiKey', 'password', 'key', 'secret', 'authorization'];
    
    Object.keys(sanitized).forEach(key => {
      const keyLower = key.toLowerCase();
      
      // Check for sensitive keys
      if (sensitiveFields.some(field => keyLower.includes(field))) {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = sanitized[key].length > 0 ? '***REDACTED***' : '';
        }
      }
      
      // Special handling for phone numbers
      if ((keyLower.includes('phone') || keyLower === 'number') && 
          typeof sanitized[key] === 'string' && 
          sanitized[key].length > 4) {
        sanitized[key] = sanitized[key].replace(/\d(?=\d{4})/g, '*');
      }
    });
    
    return sanitized;
  });
}

// Store original console methods
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

// Override console methods with sanitized versions
console.log = function() {
  originalLog.apply(console, sanitizeArgs([...arguments]));
};

console.error = function() {
  originalError.apply(console, sanitizeArgs([...arguments]));
};

console.warn = function() {
  originalWarn.apply(console, sanitizeArgs([...arguments]));
};

console.info = function() {
  originalInfo.apply(console, sanitizeArgs([...arguments]));
};