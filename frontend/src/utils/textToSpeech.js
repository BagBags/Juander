// Text-to-Speech utility for accessibility
class TextToSpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSpeaking = false;
    this.isEnabled = false; // Default to OFF
    this.currentLanguage = 'en-US'; // Default language
  }

  // Set language for TTS
  setLanguage(lang) {
    // Map i18next language codes to speech synthesis language codes
    const langMap = {
      'en': 'en-US',
      'fil': 'fil-PH', // Filipino
      'tl': 'fil-PH',  // Tagalog (alternative code)
      'es': 'es-ES',   // Spanish
      'zh': 'zh-CN',   // Chinese
    };
    
    this.currentLanguage = langMap[lang] || langMap[lang?.split('-')[0]] || 'en-US';
  }

  // Get current language from localStorage or i18next
  getCurrentLanguage() {
    try {
      // Try to get from localStorage (i18next stores it there)
      const storedLang = localStorage.getItem('i18nextLng');
      if (storedLang) {
        this.setLanguage(storedLang);
      }
    } catch (e) {
      console.warn('Could not detect language preference:', e);
    }
    return this.currentLanguage;
  }

  // Speak text with options
  speak(text, options = {}) {
    if (!this.isEnabled || !text) return;

    // Cancel any ongoing speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = options.rate || 1.0; // Speed (0.1 to 10)
    utterance.pitch = options.pitch || 1.0; // Pitch (0 to 2)
    utterance.volume = options.volume || 1.0; // Volume (0 to 1)
    
    // Use provided language or detect current language
    utterance.lang = options.lang || this.getCurrentLanguage();

    // Event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
    };

    this.synth.speak(utterance);
  }

  // Cancel current speech
  cancel() {
    if (this.synth.speaking) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  // Pause speech
  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  // Resume speech
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  // Toggle TTS on/off
  toggle() {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.cancel();
    }
    return this.isEnabled;
  }

  // Enable TTS
  enable() {
    this.isEnabled = true;
  }

  // Disable TTS
  disable() {
    this.isEnabled = false;
    this.cancel();
  }

  // Check if browser supports TTS
  isSupported() {
    return 'speechSynthesis' in window;
  }
}

// Create singleton instance
const ttsService = new TextToSpeechService();

export default ttsService;

// Helper function to get translation
const getTranslation = (key) => {
  try {
    // Try to get i18next instance
    const i18n = window.i18next;
    if (i18n && i18n.t) {
      return i18n.t(key);
    }
  } catch (e) {
    console.warn('i18next not available:', e);
  }
  
  // Fallback to English
  const fallbacks = {
    tts_distance: 'Distance',
    tts_kilometers: 'kilometers',
    tts_youAreNearby: 'You are nearby',
    tts_headingTo: 'Heading to',
    tts_kilometersAway: 'kilometers away',
    tts_youHaveArrived: 'You have arrived at',
    tts_tapToView: 'Tap to view details',
    tts_step: 'Step',
    tts_of: 'of',
  };
  
  return fallbacks[key] || key;
};

// Helper functions for common announcements
export const announceNavigation = (instruction, distance) => {
  const distanceText = getTranslation('tts_distance');
  const kmText = getTranslation('tts_kilometers');
  const text = `${instruction}. ${distanceText}: ${distance} ${kmText}.`;
  ttsService.speak(text);
};

export const announceSiteInfo = (siteName, distance, isNearby) => {
  const proximityText = isNearby 
    ? getTranslation('tts_youAreNearby')
    : getTranslation('tts_headingTo');
  const kmAwayText = getTranslation('tts_kilometersAway');
  const text = `${proximityText} ${siteName}. ${distance} ${kmAwayText}.`;
  ttsService.speak(text);
};

export const announceArrival = (siteName) => {
  const arrivedText = getTranslation('tts_youHaveArrived');
  const tapText = getTranslation('tts_tapToView');
  const text = `${arrivedText} ${siteName}. ${tapText}.`;
  ttsService.speak(text, { rate: 0.9 });
};

export const announceDirectionStep = (instruction, stepNumber, totalSteps) => {
  // Only read the instruction, not the step number
  ttsService.speak(instruction);
};
