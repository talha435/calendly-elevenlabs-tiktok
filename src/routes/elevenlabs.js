// src/routes/elevenlabs.js
const express = require('express');
const router = express.Router();
const calendlyService = require('../services/calendlyService');
const twilioService = require('../services/twilioService');
const config = require('../config/environment');
const agentBuilderService = require('../services/agentBuilderService');
const timeUtils = require('../utils/time-utils');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * Handles Elevenlabs personalization webhook to provide context variables
 * for voice agent conversations. Returns date, time, and caller information.
 * 
 * @route   POST /api/elevenlabs/personalization
 * @desc    Handle Elevenlabs personalization webhook
 * @access  Protected
 */
router.post('/personalization', authenticateApiKey, (req, res) => {
  try {
    console.log('Processing personalization webhook request');
    
    // Get the caller number if available
    const callerNumber = req.body.caller_number || '';
    
    // Get the current date and time with time zone detection
    const now = new Date();
    const formattedDateTime = timeUtils.formatDateTime(now, callerNumber);
    const currentDate = formattedDateTime.date;
    const currentTime = formattedDateTime.time;
    
    // Log detected time zone for debugging
    if (callerNumber) {
      console.log(`Using time zone: ${formattedDateTime.timeZone} for caller ${callerNumber}`);
    }
    
    // Return the context variables
    res.json({
      variables: {
        current_date: currentDate,
        current_time: currentTime,
        caller_number: callerNumber
      }
    });
  } catch (error) {
    console.error('Error in personalization webhook:', error);
    res.status(500).json({ 
      error: 'Failed to process personalization webhook',
      message: error.message
    });
  }
});

/**
 * Central handler for Elevenlabs function calls. Delegates to appropriate
 * handler function based on the function_name parameter.
 * 
 * @route   POST /api/elevenlabs/function-handler
 * @desc    Handle Elevenlabs function calls
 * @access  Protected
 */
router.post('/function-handler', authenticateApiKey, async (req, res) => {
  try {
    console.log('Function handler called with function:', req.body.function_name);
    
    const { function_name, parameters } = req.body;
    
    // Handle different function calls
    switch (function_name) {
      case 'checkAvailability':
        return handleCheckAvailability(req, res);
      
      case 'checkTimes':
        return handleCheckTimes(req, res);
      
      case 'sendBookingSMS':
        return handleSendBookingSMS(req, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown function: ${function_name}`
        });
    }
  } catch (error) {
    console.error('Error handling function call:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process function call',
      message: error.message
    });
  }
});

/**
 * Handles calendar availability requests by retrieving and processing
 * availability data for a specific event type and date range.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleCheckAvailability(req, res) {
  try {
    const { eventTypeUrl, weekOffset = 0 } = req.body.parameters;
    
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
    
    // Format response for Elevenlabs
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
    console.error('Error checking availability:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check availability',
      message: error.message
    });
  }
}

/**
 * Retrieves specific time slots for a selected day and period (morning/afternoon).
 * Used after a caller has selected a specific date from the availability summary.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleCheckTimes(req, res) {
  try {
    const { eventTypeUrl, date, period = 'morning' } = req.body.parameters;
    
    // Validate inputs
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
      date: date,
      period: period,
      availability: timeSlots
    });
  } catch (error) {
    console.error('Error checking times:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check times',
      message: error.message
    });
  }
}

/**
 * Sends a booking confirmation SMS to the caller with scheduling details.
 * Extracts parameters from the request body and uses Twilio to send the message.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleSendBookingSMS(req, res) {
  console.log('Processing SMS booking request');
  
  try {
    // Extract parameters from request body
    let phoneNumber, name, eventTime, eventDuration, schedulingUrl;
    
    if (req.body.parameters) {
      // Handle nested parameters structure
      console.log('Using nested parameters structure');
      ({ phoneNumber, name, eventTime, eventDuration, schedulingUrl } = req.body.parameters);
    } else {
      // Handle flat parameters structure
      console.log('Using flat parameters structure');
      ({ phoneNumber, name, eventTime, eventDuration, schedulingUrl } = req.body);
    }
    
    // Log extracted parameters for debugging
    console.log('Processing booking with parameters:', { 
      phoneNumber, name, eventTime, eventDuration, schedulingUrl 
    });
    
    // Validate phone number
    if (!phoneNumber) {
      console.error('Phone number is missing');
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }
    
    console.log(`Attempting to send SMS to: ${phoneNumber}`);
    
    // Send the SMS
    try {
      const result = await twilioService.sendBookingSMS(phoneNumber, {
        name,
        eventTime,
        eventDuration,
        schedulingUrl
      });
      
      console.log('SMS sent successfully');
      
      res.json({
        success: true,
        message: 'SMS sent successfully',
        details: result
      });
    } catch (twilioError) {
      console.error('Twilio service error:', twilioError);
      
      res.status(500).json({
        success: false,
        error: `Twilio error: ${twilioError.message}`,
        code: twilioError.code,
        details: twilioError
      });
    }
  } catch (error) {
    console.error('Error in SMS booking handler:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send booking SMS',
      message: error.message
    });
  }
}

/**
 * Handles Twilio call personalization by providing dynamic context for
 * incoming calls. Detects caller's time zone, formats date/time, and
 * provides context variables to the agent.
 * 
 * @route   POST /api/elevenlabs/twilio-personalization
 * @desc    Handle Twilio call personalization webhook
 * @access  Protected
 */
router.post('/twilio-personalization', authenticateApiKey, (req, res) => {
  try {
    console.log('Processing Twilio personalization webhook');
    
    // Extract Twilio-specific parameters
    const { caller_id, agent_id, called_number, call_sid } = req.body;
    
    // Log the incoming call details
    console.log(`Incoming call from ${caller_id} to ${called_number} (Agent: ${agent_id}, Call SID: ${call_sid})`);
    
    // Get the current date and time with time zone detection
    const now = new Date();
    
    // Use time zone detection from phone number
    const formattedDateTime = timeUtils.formatDateTime(now, caller_id);
    const currentDate = formattedDateTime.date;
    const currentTime = formattedDateTime.time;
    
    // Log detected time zone for debugging
    console.log(`Using time zone: ${formattedDateTime.timeZone} for caller ${caller_id}`);
    
    // Format the caller's phone number for display if available
    let callerInfo = "";
    if (caller_id && caller_id.length > 0) {
      // Simple formatting for display (last 4 digits only for privacy)
      const lastFourDigits = caller_id.slice(-4);
      callerInfo = `from caller ending in ${lastFourDigits}`;
    }
    
    // Import the system prompt
    const systemPrompt = require('../config/prompts/systemPrompt');
    
    // Replace placeholder variables in the system prompt
    let customizedPrompt = systemPrompt
      .replace(/{{current_date}}/g, currentDate)
      .replace(/{{current_time}}/g, currentTime)
      .replace(/{{caller_number}}/g, caller_id || "");
    
    // Return the personalization data
    res.json({
      // Dynamic variables that can be used in the agent's prompt
      dynamic_variables: {
        current_date: currentDate,
        current_time: currentTime,
        caller_number: caller_id || "",
        caller_info: callerInfo
      },
      // Optional overrides for the agent configuration
      conversation_config_override: {
        agent: {
          // Use the full system prompt with replaced variables
          prompt: {
            prompt: customizedPrompt
          }
        }
      }
    });
  } catch (error) {
    console.error('Error in Twilio personalization webhook:', error);
    res.status(500).json({ 
      error: 'Failed to process Twilio personalization webhook',
      message: error.message
    });
  }
});

/**
 * Generates an appropriate greeting based on the time of day.
 * 
 * @param {Date} dateTime - Current date/time
 * @returns {String} Time-appropriate greeting
 */
function getGreetingByTimeOfDay(dateTime) {
  const hour = dateTime.getHours();
  
  if (hour < 12) {
    return "Good morning!";
  } else if (hour < 18) {
    return "Good afternoon!";
  } else {
    return "Good evening!";
  }
}

/**
 * Creates and uploads an Elevenlabs voice agent with the provided configuration.
 * Connects the agent to Calendly events and configures webhooks.
 * 
 * @route   POST /api/elevenlabs/create-agent
 * @desc    Creates and uploads an Elevenlabs agent
 * @access  Protected - requires API key
 */
router.post('/create-agent', authenticateApiKey, async (req, res) => {
  try {
    const { 
      agentName, 
      serverUrl, 
      eventTypes,
      agentGreeting  
    } = req.body;
    
    // Use API keys from environment variables
    const elevenlabsApiKey = config.elevenlabs.apiKey;
    const serverApiKey = config.apiKey; // Always use server's own API key
    
    // Validate required fields
    if (!serverUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: serverUrl'
      });
    }
    
    // Validate Elevenlabs API key is configured
    if (!elevenlabsApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Elevenlabs API key not configured',
        details: 'Please set the ELEVENLABS_API_KEY environment variable'
      });
    }
    
    if (!eventTypes || !Array.isArray(eventTypes) || eventTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one event type is required'
      });
    }
    
    console.log('Creating agent with the following parameters:', {
      agentName,
      serverUrl,
      eventTypesCount: eventTypes.length
    });
    
    // Generate agent configuration
    const agentConfig = await agentBuilderService.createAgentConfig({
      agentName,
      serverUrl,
      serverApiKey: serverApiKey, // Always use server's own API key
      eventTypes,
      agentGreeting 
    });
    
    console.log('Agent configuration created, uploading to Elevenlabs');
    
    // Upload to Elevenlabs
    try {
      const elevenlabsResponse = await agentBuilderService.uploadAgentToElevenlabs(
        agentConfig,
        elevenlabsApiKey
      );
      
      console.log('Agent successfully uploaded to Elevenlabs');
      
      // Return the successful response
      res.json({
        success: true,
        message: 'Agent created successfully in Elevenlabs',
        agent_id: elevenlabsResponse.agent_id,
        agent_url: `https://elevenlabs.io/app/conversational-ai/agents/${elevenlabsResponse.agent_id}`,
        details: elevenlabsResponse
      });
    } catch (elevenlabsError) {
      // Handle Elevenlabs API errors with specific details
      console.error('Elevenlabs API error:', elevenlabsError);
      
      if (elevenlabsError.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Elevenlabs authentication failed',
          details: 'The Elevenlabs API key is invalid or has insufficient permissions'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Elevenlabs API error',
          message: process.env.NODE_ENV === 'production' ? 
            'Failed to create agent in Elevenlabs' : 
            (elevenlabsError.response?.data?.detail || elevenlabsError.message)
        });
      }
    }
  } catch (error) {
    // Handle general errors
    console.error('Error creating agent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create agent',
      message: process.env.NODE_ENV === 'production' ? 
        'An unexpected error occurred' : 
        error.message
    });
  }
});

module.exports = router;