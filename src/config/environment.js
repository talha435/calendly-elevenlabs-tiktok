// src/config/environment.js
require('dotenv').config();

// Required environment variables
const requiredEnvVars = [
    'API_KEY',
    'ADMIN_PASSWORD'
];

// Optional environment variable groups with their conditions
const optionalGroups = {
    calendly: {
        condition: true, // Core functionality
        vars: ['CALENDLY_API_TOKEN']
    },
    elevenlabs: {
        condition: true, // Voice agent functionality
        vars: ['ELEVENLABS_API_KEY']
    },
    github: {
        condition: true, // Prompt editing
        vars: ['GITHUB_TOKEN', 'GITHUB_REPO_OWNER', 'GITHUB_REPO_NAME']
    },
    sms: {
        condition: process.env.ENABLE_SMS === 'true',
        vars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
    }
};

// Check required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('Please set these variables in your .env file');
}

// Check optional groups based on their conditions
Object.entries(optionalGroups).forEach(([groupName, group]) => {
    if (group.condition) {
        const missingGroupVars = group.vars.filter(envVar => !process.env[envVar]);
        if (missingGroupVars.length > 0) {
            console.warn(`⚠️  ${groupName.toUpperCase()} functionality may not work correctly. Missing variables: ${missingGroupVars.join(', ')}`);
        }
    }
});

// Export configuration
module.exports = {
    // Server config
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiKey: process.env.API_KEY,
    defaultTimeZone: process.env.DEFAULT_TIMEZONE || 'UTC',
    adminPassword: process.env.ADMIN_PASSWORD,

    // Calendly config
    calendly: {
        apiToken: process.env.CALENDLY_API_TOKEN,
        baseUrl: 'https://api.calendly.com',
        userUuid: process.env.CALENDLY_USER_UUID
    },

    // Elevenlabs config
    elevenlabs: {
        apiKey: process.env.ELEVENLABS_API_KEY
    },

    // GitHub config
    github: {
        token: process.env.GITHUB_TOKEN,
        repoOwner: process.env.GITHUB_REPO_OWNER,
        repoName: process.env.GITHUB_REPO_NAME,
        branch: process.env.GITHUB_BRANCH || 'master'
    },

    // Twilio SMS config
    sms: {
        enabled: process.env.ENABLE_SMS === 'true',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
    }
};