// src/services/twilioService.js
const twilio = require('twilio');
const config = require('../config/environment');

/**
 * Creates a Twilio client if SMS is enabled and configured.
 * 
 * @returns {Object|null} Twilio client or null if disabled/not configured
 */
const createTwilioClient = () => {
  if (!config.sms.enabled) {
    console.log('SMS notifications are disabled');
    return null;
  }
  
  if (!config.sms.accountSid || !config.sms.authToken) {
    console.warn('Twilio credentials not configured');
    return null;
  }
  
  return twilio(
    config.sms.accountSid,
    config.sms.authToken
  );
};

// Initialize Twilio client
const twilioClient = createTwilioClient();

/**
 * Sends a booking confirmation SMS with scheduling details.
 * 
 * @param {String} phoneNumber - Recipient's phone number
 * @param {Object} bookingDetails - Booking information
 * @param {String} bookingDetails.name - Customer name
 * @param {String} bookingDetails.eventTime - Formatted event time
 * @param {String} bookingDetails.eventDuration - Duration in minutes
 * @param {String} bookingDetails.schedulingUrl - Calendly scheduling URL
 * @returns {Promise<Object>} SMS response details
 */
async function sendBookingSMS(phoneNumber, bookingDetails) {
  if (!twilioClient) {
    throw new Error('SMS service is not configured');
  }
  
  if (!phoneNumber) {
    throw new Error('Phone number is required');
  }
  
  if (!bookingDetails.name || !bookingDetails.eventTime || 
      !bookingDetails.eventDuration || !bookingDetails.schedulingUrl) {
    throw new Error('Incomplete booking details');
  }
  
  try {
    // Format the message
    const message = `Thank you ${bookingDetails.name} for booking a ${bookingDetails.eventDuration}-minute consultation for ${bookingDetails.eventTime}. Please confirm your booking here: ${bookingDetails.schedulingUrl}`;
    
    // Send the SMS
    console.log(`Sending SMS to ${phoneNumber}`);
    
    const response = await twilioClient.messages.create({
      body: message,
      from: config.sms.phoneNumber,
      to: phoneNumber
    });
    
    console.log(`SMS sent successfully. SID: ${response.sid}`);
    
    return {
      success: true,
      messageId: response.sid,
      status: response.status,
      message: 'SMS sent successfully'
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Validates if a phone number is in correct format.
 * 
 * @param {String} phoneNumber - Phone number to validate
 * @returns {Boolean} Whether the phone number is valid
 */
function isValidPhoneNumber(phoneNumber) {
  // Simple regex for international phone number format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}

module.exports = {
  sendBookingSMS,
  isValidPhoneNumber
};