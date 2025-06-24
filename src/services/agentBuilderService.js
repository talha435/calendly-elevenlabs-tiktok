// src/services/agentBuilderService.js
const axios = require('axios');

/**
 * Creates a complete Elevenlabs agent configuration with all required
 * webhooks, functions, and personalization settings.
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.agentName - Name for the agent
 * @param {string} options.serverUrl - URL where this server is hosted
 * @param {string} options.serverApiKey - API key for server authentication
 * @param {Array} options.eventTypes - List of available Calendly events
 * @returns {Object} Elevenlabs agent configuration
 */
async function createAgentConfig(options) {
  const {
    agentName = "Calendly Booking Assistant",
    serverUrl,
    serverApiKey,
    eventTypes = [],
    agentGreeting = "Hi there! I'm your Calendly booking assistant. How can I help you schedule an appointment today?"
  } = options;
  
  if (!serverUrl) throw new Error('Server URL is required');
  if (!serverApiKey) throw new Error('Server API Key is required');
  if (eventTypes.length === 0) throw new Error('At least one event type is required');

  const hostname = new URL(serverUrl).hostname;

  let eventTypeDescription = "IMPORTANT: Use the EXACT URI without abbreviation.";
  if (eventTypes.length >= 1) {
    eventTypeDescription += ` For 30-minute AI Automation Discovery Call: ${eventTypes[0]?.id || eventTypes[0]}`;
  }
  if (eventTypes.length >= 2) {
    eventTypeDescription += ` -- For 15-minute AI Automation Quick Consultation: ${eventTypes[1]?.id || eventTypes[1]}`;
  }

  return {
    name: agentName,
    conversation_config: {
      asr: {
        quality: "high",
        provider: "elevenlabs",
        user_input_audio_format: "pcm_16000",
        keywords: []
      },
      turn: {
        turn_timeout: 7.0,
        silence_end_call_timeout: 20.0,
        mode: "turn"
      },
      tts: {
        model_id: "eleven_
