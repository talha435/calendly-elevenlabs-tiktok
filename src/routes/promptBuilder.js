// src/routes/promptBuilder.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config/environment');
const { authenticateApiKey } = require('../middleware/auth');

/**
 * Updates the system prompt in the GitHub repository.
 * Uses GitHub API to commit changes to the systemPrompt.js file.
 * 
 * @route   POST /api/prompt-builder/update
 * @desc    Updates system prompt in GitHub repo
 * @access  Protected - requires API key
 */
router.post('/update', authenticateApiKey, async (req, res) => {
  try {
    // Get prompt from request body
    const { prompt } = req.body;
    
    // Get GitHub config from environment variables
    const githubToken = config.github.token;
    const repoOwner = config.github.repoOwner;
    const repoName = config.github.repoName;
    const branch = config.github.branch || 'main';
    const commitMessage = req.body.commitMessage || 'Update system prompt via Prompt Builder';
    
    // Validate prompt parameter
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: prompt'
      });
    }
    
    // Validate GitHub environment configuration
    if (!githubToken || !repoOwner || !repoName) {
      return res.status(500).json({
        success: false,
        error: 'GitHub integration not configured properly',
        missingConfig: [
          !githubToken ? 'GITHUB_TOKEN' : null,
          !repoOwner ? 'GITHUB_REPO_OWNER' : null,
          !repoName ? 'GITHUB_REPO_NAME' : null
        ].filter(Boolean)
      });
    }
    
    const promptFilePath = 'src/config/prompts/systemPrompt.js';
    
    console.log(`Updating prompt in repository ${repoOwner}/${repoName}, branch: ${branch}`);
    
    // Step 1: Get the current file to obtain the SHA
    try {
      const fileResponse = await axios.get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${promptFilePath}?ref=${branch}`,
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      const currentSha = fileResponse.data.sha;
      
      // Format the prompt into a proper JS file with export
      const formattedPrompt = `// src/config/prompts/systemPrompt.js

/**
 * System prompt for the Elevenlabs agent.
 * This can be easily edited without modifying other code.
 * 
 * Available dynamic variables:
 * {{current_date}} - Current date in format like "Friday, May 9, 2025"
 * {{current_time}} - Current time in format like "3:45 PM"
 * {{caller_number}} - Phone number of the caller (if available)
 */
const systemPrompt = \`${prompt}\`;

module.exports = systemPrompt;`;
      
      // Step 2: Update the file with new content
      const updateResponse = await axios.put(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${promptFilePath}`,
        {
          message: commitMessage,
          content: Buffer.from(formattedPrompt).toString('base64'),
          sha: currentSha,
          branch: branch
        },
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      res.json({
        success: true,
        message: 'System prompt updated successfully',
        commit: updateResponse.data.commit
      });
    } catch (githubError) {
      // Handle GitHub API errors with specific details
      console.error('GitHub API error:', githubError.response?.data || githubError);
      
      // Provide user-friendly error response
      if (githubError.response?.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Repository or file not found',
          details: 'Check your repository details and ensure the file path is correct'
        });
      } else if (githubError.response?.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'GitHub authentication failed',
          details: 'The GitHub token is invalid or has insufficient permissions'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'GitHub API error',
          message: githubError.response?.data?.message || githubError.message
        });
      }
    }
  } catch (error) {
    // Handle general errors
    console.error('Error updating system prompt:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update system prompt',
      message: process.env.NODE_ENV === 'production' ? 
        'An unexpected error occurred' : 
        (error.response?.data?.message || error.message)
    });
  }
});

module.exports = router;