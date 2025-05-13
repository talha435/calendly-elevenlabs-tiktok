# 🤖📅 Calendly-Elevenlabs Integration

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TikTok](https://img.shields.io/badge/TikTok-%23000000.svg?style=flat&logo=TikTok&logoColor=white)](https://www.tiktok.com/@ai_entrepreneur_educator)

Create a voice AI agent that handles appointment scheduling through Calendly - no coding required! This project connects Elevenlabs' voice agents with Calendly's scheduling API to create a seamless booking experience.

<p align="center">
<img src="public/images/server-home-page.png" alt="Calendly-Elevenlabs Integration Demo" width="800">
</p>

## ✨ Features

- **Voice Agent Scheduling** - Let callers book appointments through AI phone calls
- **Real-time Availability** - Check your Calendly calendar for open time slots
- **Automatic Timezone Detection** - Adjust times based on caller's phone number
- **SMS Confirmations** - Send booking links via SMS
- **Natural Conversations** - Human-like dialogue with customizable behavior
- **Easy Setup** - No coding required, just configure and deploy
- **Secure by Design** - All API keys stored in environment variables

## 🚀 Quick Start

1. **Fork this Repository**
   - Click the "Fork" button at the top right of this page

2. **Deploy to Render**
   - Click the "Deploy to Render" button above
   - Connect your GitHub account
   - Select your forked repository
   - Configure service name (e.g., "calendly-elevenlabs-server")
   - Deploy!

3. **Add Environment Variables**
   - `API_KEY` - Create your own secret key (any secure string)
   - `ADMIN_PASSWORD` - Password for accessing admin pages
   - `CALENDLY_API_TOKEN` - Your Calendly API token
   - `ELEVENLABS_API_KEY` - Your Elevenlabs API key
   - `GITHUB_TOKEN` - GitHub personal access token with repo scope
   - `GITHUB_REPO_OWNER` - Your GitHub username
   - `GITHUB_REPO_NAME` - Name of your forked repository
   - `ENABLE_SMS=true` - Enable SMS functionality (required)
   - `TWILIO_ACCOUNT_SID` - Your Twilio account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio authentication token
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number

4. **Create Your Agent**
   - Navigate to your deployed site
   - Log in to admin pages when prompted (use any username with your ADMIN_PASSWORD)
   - Use the Agent Builder to connect to your Calendly account
   - Customize your agent's behavior with the Prompt Builder
   - Start receiving calls!

## 📚 Documentation

Comprehensive documentation is available in the deployed application:

- **Setup Guide** - Detailed deployment instructions
- **Integration Guide** - How to set up Calendly, Elevenlabs, GitHub, and Twilio
- **Agent Builder Guide** - Create and configure your voice agent
- **System Prompt Guide** - Customize your agent's behavior
- **Technical Reference** - API endpoints and configuration options
- **Troubleshooting** - Solutions for common issues

## 🔒 Security Features

This application is designed with security in mind:

- **Environment Variables** - All sensitive API keys stored securely
- **Admin Authentication** - Protected access to admin interfaces
- **API Protection** - All endpoints require authentication
- **HTTPS Enforcement** - Secure communication in production
- **Rate Limiting** - Protection against abuse
- **Security Headers** - Defense against common web vulnerabilities

## 🛠️ Technologies Used

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Elevenlabs Voice Agents](https://elevenlabs.io/voice-agents)
- [Calendly API](https://developer.calendly.com/)
- [GitHub API](https://docs.github.com/en/rest) (for prompt customization)
- [Twilio SMS](https://www.twilio.com/) (for booking confirmations)

## 🎬 TikTok Tutorial Series

This project is part of my TikTok tutorial series on building AI voice agents. Follow along for step-by-step guidance and tips:

- [TikTok: @ai_entrepreneur_educator](https://www.tiktok.com/@ai_entrepreneur_educator)

## 🤔 How It Works

The integration connects Elevenlabs' voice agents with your Calendly account through a backend server:

1. Caller phones your Elevenlabs voice agent number
2. The voice agent uses webhook functions to check your Calendly availability
3. Caller selects a meeting type and preferred time
4. System sends booking link via SMS for final confirmation
5. Appointment is added to your Calendly calendar when confirmed

## 🙋‍♀️ Support

- **Documentation**: Access the in-app help pages for comprehensive guidance
- **Issues**: Create a GitHub issue for bugs or feature requests
- **TikTok**: Comment on related tutorial videos for community support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
Made with ❤️ for the TikTok community by <a href="https://bramforth.ai">Bramforth.ai</a>
</p>