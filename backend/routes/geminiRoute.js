// routes/geminiRoute.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Gemini chat proxy endpoint
router.post('/chat', async (req, res) => {
  try {
    const { system, user } = req.body;

    if (!user) {
      return res.status(400).json({ error: 'User message is required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Compose a single prompt using system + user to keep logic minimal
    const promptText = system ? `${system}\n\nUser: ${user}` : user;

    // Call Gemini Generative Language API (models: gemini-1.5-flash for speed/cost)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(
      url,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Extract text safely
    const candidates = response.data?.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    const message = parts
      .map((p) => p.text)
      .filter(Boolean)
      .join('\n') || 'No response from Gemini.';

    return res.json({ message });
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to get response from Gemini',
      details: error.response?.data?.error?.message || error.message,
    });
  }
});

module.exports = router;