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
        model_id: "eleven_flash_v2",
        voice_id: "cgSgspJ2msm6clMCkdW9",
        agent_output_audio_format: "pcm_16000",
        optimize_streaming_latency: 3,
        stability: 0.5,
        speed: 1.0,
        similarity_boost: 0.8,
        pronunciation_dictionary_locators: []
      },
      conversation: {
        max_duration_seconds: 600,
        client_events: [
          "audio",
          "interruption",
          "user_transcript",
          "agent_response",
          "agent_response_correction"
        ]
      },
      language_presets: {},
      agent: {
        first_message: agentGreeting,
        language: "en",
        dynamic_variables: {
          dynamic_variable_placeholders: {
            current_date: "Friday, May 10, 2025",
            current_time: "2:30 PM",
            caller_number: "+1234567890"
          }
        },
        prompt: {
          prompt: "Prompt is configured through prompts.js file on the server.",
          llm: "gpt-4.1-mini",
          temperature: 0.35,
          max_tokens: -1,
          tools: [
            {
              id: "ynkWMyhMnGlLHAv7o5XI",
              name: "sendBookingSMS",
              description: "Use this function to send an SMS confirmation...",
              type: "webhook",
              api_schema: {
                url: `${serverUrl}/api/elevenlabs/function-handler`,
                method: "POST",
                path_params_schema: {},
                query_params_schema: null,
                request_body_schema: {
                  type: "object",
                  required: [
                    "eventTime",
                    "function_name",
                    "phoneNumber",
                    "eventDuration",
                    "schedulingUrl",
                    "name"
                  ],
                  description: "Parameters for sending booking confirmation SMS",
                  properties: {
                    eventTime: { type: "string", description: "Formatted time" },
                    function_name: { type: "string", constant_value: "sendBookingSMS" },
                    phoneNumber: { type: "string", dynamic_variable: "system__caller_id" },
                    eventDuration: { type: "string", description: "15 or 30" },
                    schedulingUrl: { type: "string" },
                    name: { type: "string" }
                  }
                },
                request_headers: {
                  "X-API-Key": serverApiKey,
                  "Content-Type": "application/json"
                }
              },
              dynamic_variables: {
                dynamic_variable_placeholders: {}
              }
            },
            {
              id: "OWO956TMCS1s6dN1jgp9",
              name: "checkTimes",
              description: "Detailed time slots for a selected day",
              type: "webhook",
              api_schema: {
                url: `${serverUrl}/api/elevenlabs/function-handler`,
                method: "POST",
                path_params_schema: {},
                query_params_schema: null,
                request_body_schema: {
                  type: "object",
                  required: ["function_name", "parameters"],
                  properties: {
                    function_name: { type: "string", constant_value: "checkTimes" },
                    parameters: {
                      type: "object",
                      required: ["eventTypeUrl", "date", "period"],
                      properties: {
                        eventTypeUrl: { type: "string", description: eventTypeDescription },
                        date: { type: "string", description: "YYYY-MM-DD" },
                        period: { type: "string", description: "'morning' or 'afternoon'" }
                      }
                    }
                  }
                },
                request_headers: {
                  "X-API-Key": serverApiKey,
                  "Content-Type": "application/json"
                }
              },
              dynamic_variables: {
                dynamic_variable_placeholders: {}
              }
            },
            {
              id: "yzW6vNfJybNSU8Q8YJeo",
              name: "checkAvailability",
              description: "Shows morning/afternoon availability for each day",
              type: "webhook",
              api_schema: {
                url: `${serverUrl}/api/elevenlabs/function-handler`,
                method: "POST",
                path_params_schema: {},
                query_params_schema: null,
                request_body_schema: {
                  type: "object",
                  required: ["function_name", "parameters"],
                  properties: {
                    function_name: { type: "string", constant_value: "checkAvailability" },
                    parameters: {
                      type: "object",
                      required: ["eventTypeUrl"],
                      properties: {
                        eventTypeUrl: { type: "string", description: eventTypeDescription },
                        weekOffset: { type: "integer", description: "0 = this week, 1 = next, etc." }
                      }
                    }
                  }
                },
                request_headers: {
                  "X-API-Key": serverApiKey,
                  "Content-Type": "application/json"
                }
              },
              dynamic_variables: {
                dynamic_variable_placeholders: {}
              }
            },
            {
              id: "4llGAKqlunOuAWS1pfBv",
              name: "end_call",
              description: "",
              type: "system",
              params: {
                system_tool_type: "end_call"
              }
            }
          ],
          mcp_server_ids: [],
          knowledge_base: [],
          custom_llm: null,
          ignore_default_personality: false,
          rag: {
            enabled: false,
            embedding_model: "e5_mistral_7b_instruct",
            max_vector_distance: 0.6,
            max_documents_length: 50000
          }
        }
      }
    },
    platform_settings: {
      auth: {
        enable_auth: false,
        allowlist: [{ hostname }]
      },
      evaluation: { criteria: [] },
      widget: {
        variant: "full",
        expandable: "never",
        avatar: { type: "orb", color_1: "#6DB035", color_2: "#F5CABB" },
        feedback_mode: "during",
        bg_color: "#ffffff",
        text_color: "#000000",
        btn_color: "#000000",
        btn_text_color: "#ffffff",
        border_color: "#e1e1e1",
        focus_color: "#000000",
        border_radius: null,
        btn_radius: null,
        show_avatar_when_collapsed: true,
        disable_banner: false,
        mic_muting_enabled: false,
        language_selector: false,
        shareable_page_show_terms: true,
        terms_text: "#### Terms and conditions\n\nBy clicking \"Agree,\" and each time I interact with this AI agent, I consent to the recording...",
        terms_html: "<h4>Terms and conditions</h4>\n<p>By clicking &quot;Agree,&quot; and each time I interact with this AI agent...</p>"
      },
      data_collection: {},
      overrides: {
        conversation_config_override: {
          agent: {
            prompt: { prompt: true },
            first_message: true,
            language: true
          },
          tts: { voice_id: true }
        },
        custom_llm_extra_body: false,
        enable_conversation_initiation_client_data_from_webhook: true
      },
      call_limits: {
        agent_concurrency_limit: -1,
        daily_limit: 100000
      },
      privacy: {
        record_voice: true,
        retention_days: 730,
        delete_transcript_and_pii: true,
        delete_audio: true,
        apply_to_existing_conversations: false
      },
      workspace_overrides: {
        conversation_initiation_client_data_webhook: {
          url: `${serverUrl}/api/elevenlabs/twilio-personalization`,
          request_headers: { "X-API-Key": serverApiKey }
        }
      },
      safety: {
        is_blocked_ivc: false,
        is_blocked_non_ivc: false,
        ignore_safety_evaluation: false
      }
    }
  };
}

/**
 * Uploads agent configuration to Elevenlabs API.
 * 
 * @param {Object} config - Agent configuration
 * @param {String} elevenlabsApiKey - Elevenlabs API key
 * @returns {Object} Elevenlabs response with agent ID
 */
async function uploadAgentToElevenlabs(config, elevenlabsApiKey) {
  try {
    console.log('Sending request to Elevenlabs API');

    const response = await axios.post(
      'https://api.elevenlabs.io/v1/convai/agents/create',
      config,
      {
        headers: {
          'xi-api-key': elevenlabsApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading agent to Elevenlabs:', error.response?.status);
    console.error('Error details:', error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to upload agent to Elevenlabs');
  }
}

module.exports = {
  createAgentConfig,
  uploadAgentToElevenlabs
};
