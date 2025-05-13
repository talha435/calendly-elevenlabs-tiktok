// src/routes/notifications.js
const express = require('express');
const router = express.Router();
const twilioService = require('../services/twilioService');
const config = require('../config/environment');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * Sends a booking confirmation SMS with appointment details.
 * 
 * @route   POST /api/notifications/sms
 * @desc    Send booking confirmation SMS
 * @access  Protected
 */
router.post('/sms', authenticateApiKey, async (req, res) => {
  try {
    const { phoneNumber, bookingDetails } = req.body;
    
    // Validate phone number
    if (!phoneNumber || !twilioService.isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number'
      });
    }
    
    // Validate booking details
    if (!bookingDetails || !bookingDetails.name || !bookingDetails.eventTime ||
        !bookingDetails.eventDuration || !bookingDetails.schedulingUrl) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking details',
        required: ['name', 'eventTime', 'eventDuration', 'schedulingUrl']
      });
    }
    
    // Send SMS
    const result = await twilioService.sendBookingSMS(phoneNumber, bookingDetails);
    
    res.json(result);
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS notification',
      message: error.message
    });
  }
});

module.exports = router;