const express = require("express");
const router = express.Router();
const textToSpeech = require("@google-cloud/text-to-speech");

// Initialize Google Cloud TTS client
// Make sure the service account key JSON is located at the project root
// and GOOGLE_APPLICATION_CREDENTIALS env var is set OR adjust keyFilename below.
const client = new textToSpeech.TextToSpeechClient({
  // If GOOGLE_APPLICATION_CREDENTIALS is set, you can omit keyFilename.
  keyFilename: process.env.GOOGLE_TTS_KEY || require('path').join(__dirname, "..", "juander-467605-7ad8b29a0115.json"),
});

// POST /api/tts/speak
router.post("/speak", async (req, res) => {
  try {
    const { text = "" } = req.body;
    if (!text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const request = {
      input: { text },
      voice: {
        languageCode: "fil-PH", // Filipino / Tagalog
        name: "fil-PH-Wavenet-A",
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    res.set("Content-Type", "audio/mpeg");
    res.send(response.audioContent);
  } catch (err) {
    console.error("TTS Error:", err);
    res.status(500).send("TTS Error");
  }
});

module.exports = router;
