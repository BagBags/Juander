// routes/openaiRoute.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Credits endpoint removed - not supported from backend API

// Endpoint for content moderation
router.post('/moderate', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input text is required' });
    }

    // Get OpenAI API key from environment variable
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Call OpenAI Moderation API
    const response = await axios.post(
      'https://api.openai.com/v1/moderations',
      {
        model: "omni-moderation-latest",
        input
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Return the moderation results
    res.json(response.data);

  } catch (error) {
    console.error('OpenAI Moderation API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to moderate content with OpenAI',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// OpenAI API endpoint
router.post('/chat', async (req, res) => {
  try {
    const { messages, model = 'gpt-5-mini', max_completion_tokens = 2000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get OpenAI API key from environment variable
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        max_completion_tokens,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Return the assistant's message
    console.log('OpenAI Full Response:', JSON.stringify(response.data, null, 2));
    const assistantMessage = response.data.choices[0].message.content;
    console.log('Assistant Message:', assistantMessage);
    res.json({ message: assistantMessage });

  } catch (error) {
    console.error('OpenAI API Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to get response from OpenAI',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
