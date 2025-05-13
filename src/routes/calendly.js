// src/routes/calendly.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const calendlyService = require('../services/calendlyService');
const config = require('../config/environment');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * Gets all event types from Calendly using server's API token.
 * 
 * @route   GET /api/calendly/events
 * @desc    Get all event types from Calendly using server's API token
 * @access  Protected - requires API key
 */
router.get('/events', authenticateApiKey, async (req, res) => {
  try {
    // Check if Calendly API token is configured
    if (!config.calendly.apiToken) {
      return res.status(500).json({
        success: false,
        error: 'Calendly integration not configured properly',
        details: 'CALENDLY_API_TOKEN environment variable is missing'
      });
    }

    // Use the server's Calendly token
    try {
      const events = await calendlyService.getEventTypes();
      return res.json({ success: true, events });
    } catch (calendlyError) {
      // Handle specific Calendly API errors
      if (calendlyError.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Calendly authentication failed',
          details: 'The configured Calendly API token is invalid'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Calendly API error',
          message: calendlyError.response?.data?.message || calendlyError.message
        });
      }
    }
  } catch (error) {
    // Handle general errors
    console.error('Error fetching event types:', error.response?.data || error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event types',
      message: process.env.NODE_ENV === 'production' ?
        'An unexpected error occurred' :
        (error.response?.data?.message || error.message)
    });
  }
});

/**
 * Gets availability summary for a week, showing open days.
 * 
 * @route   GET /api/calendly/availability/summary
 * @desc    Get availability summary for a week
 * @access  Protected
 */
router.get('/availability/summary', authenticateApiKey, async (req, res) => {
  try {
    // Validate parameters
    const weekOffset = parseInt(req.query.weekOffset || 0, 10);
    const eventTypeUrl = req.query.eventTypeUrl;

    if (!eventTypeUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: eventTypeUrl'
      });
    }

    // Get date range
    const { startTime, endTime, readable } = calendlyService.getDateRange(weekOffset);
    const currentTime = calendlyService.getCurrentTime();

    // Get availability data
    const availabilityData = await calendlyService.getAvailabilityData(
      eventTypeUrl,
      startTime,
      endTime
    );

    // Process data
    const summary = calendlyService.processAvailabilityToSummary(availabilityData);

    // Send response
    res.json({
      success: true,
      current_time: currentTime,
      event_type: eventTypeUrl,
      date_range: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        start_readable: readable?.start,
        end_readable: readable?.end
      },
      availability: summary
    });
  } catch (error) {
    console.error('Error fetching availability summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability summary',
      message: error.message
    });
  }
});

/**
 * Gets specific time slots for a given date.
 * 
 * @route   GET /api/calendly/availability/times
 * @desc    Get specific time slots for a date
 * @access  Protected
 */
router.get('/availability/times', authenticateApiKey, async (req, res) => {
  try {
    // Validate parameters
    const { date, period = 'morning', eventTypeUrl } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: date'
      });
    }

    if (!eventTypeUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: eventTypeUrl'
      });
    }

    // Validate date is parseable
    if (isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Please provide a valid date (e.g., YYYY-MM-DD)'
      });
    }

    // Validate period
    if (period !== 'morning' && period !== 'afternoon') {
      return res.status(400).json({
        success: false,
        error: 'Invalid parameter: period. Valid values are "morning" or "afternoon"'
      });
    }

    // Get current time
    const currentTime = calendlyService.getCurrentTime();

    // Get date range for the specific date
    const { startTime, endTime } = calendlyService.getDateRange(0, date);

    // Get availability data
    const availabilityData = await calendlyService.getAvailabilityData(
      eventTypeUrl,
      startTime,
      endTime
    );

    // Process time slots
    const timeSlots = calendlyService.processTimeSlotsForPeriod(availabilityData, period);

    // Send response
    res.json({
      success: true,
      current_time: currentTime,
      event_type: eventTypeUrl,
      date_range: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      availability: timeSlots
    });
  } catch (error) {
    console.error('Error fetching availability times:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability times',
      message: error.message
    });
  }
});

/**
 * Gets all event types using a provided Calendly token.
 * Used for agent setup and configuration.
 * 
 * @route   GET /api/calendly/events-with-token
 * @desc    Get all event types using provided token
 * @access  Protected
 */
router.get('/events-with-token', authenticateApiKey, async (req, res) => {
  try {
    const calendlyToken = req.headers['x-calendly-token'];

    if (!calendlyToken) {
      return res.status(400).json({
        success: false,
        error: 'Calendly API token is required in X-Calendly-Token header'
      });
    }

    // Create a temporary API client with the provided token
    const tempClient = axios.create({
      baseURL: 'https://api.calendly.com',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${calendlyToken}`
      }
    });

    // Get the current user to find their UUID
    const userResponse = await tempClient.get('/users/me');
    const userUri = userResponse.data.resource.uri;

    // Get event types
    const eventsResponse = await tempClient.get('/event_types', {
      params: { user: userUri }
    });

    const events = eventsResponse.data.collection.map(event => ({
      id: event.uri,
      name: event.name,
      duration: event.duration,
      description: event.description_plain || '',
      url: event.scheduling_url
    }));

    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching event types with token:', error.response?.data || error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event types',
      message: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;