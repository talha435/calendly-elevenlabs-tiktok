// src/utils/time-utils.js
const { parsePhoneNumber } = require('libphonenumber-js');
const config = require('../config/environment');

// Mapping of country codes to primary time zones
const COUNTRY_TIMEZONE_MAP = {
  'US': 'America/New_York',
  'GB': 'Europe/London',
  'CA': 'America/Toronto',
  'AU': 'Australia/Sydney',
  'NZ': 'Pacific/Auckland',
  'IN': 'Asia/Kolkata',
  'JP': 'Asia/Tokyo',
  'CN': 'Asia/Shanghai',
  'DE': 'Europe/Berlin',
  'FR': 'Europe/Paris',
  'ES': 'Europe/Madrid',
  'IT': 'Europe/Rome',
  // This mapping can be expanded as needed
};

/**
 * Detects time zone from phone number or uses configured default.
 * 
 * @param {String} phoneNumber - Phone number with country code (e.g., +1234567890)
 * @returns {String} Time zone identifier
 */
function detectTimeZone(phoneNumber) {
  // If no phone number provided, use default
  if (!phoneNumber) {
    return config.defaultTimeZone || 'UTC';
  }
  
  try {
    // Parse the phone number to get country
    const parsedNumber = parsePhoneNumber(phoneNumber);
    if (!parsedNumber || !parsedNumber.country) {
      return config.defaultTimeZone || 'UTC';
    }
    
    // Look up the time zone for this country
    const timeZone = COUNTRY_TIMEZONE_MAP[parsedNumber.country];
    
    // Return the detected time zone or fall back to default
    return timeZone || config.defaultTimeZone || 'UTC';
  } catch (error) {
    console.warn(`Error detecting time zone from phone number: ${error.message}`);
    return config.defaultTimeZone || 'UTC';
  }
}

/**
 * Formats date and time according to detected or configured timezone.
 * 
 * @param {Date} date - Date object to format
 * @param {String} phoneNumber - Phone number for time zone detection
 * @returns {Object} Formatted date and time strings with time zone info
 */
function formatDateTime(date = new Date(), phoneNumber = null) {
  const timeZone = detectTimeZone(phoneNumber);
  
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: timeZone
  });
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timeZone
  });
  
  return {
    date: formattedDate,
    time: formattedTime,
    timeZone: timeZone
  };
}

module.exports = {
  formatDateTime,
  detectTimeZone
};