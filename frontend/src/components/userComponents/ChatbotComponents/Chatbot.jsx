import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faVolumeUp,
  faVolumeMute,
  faMicrophone,
  faStop,
} from "@fortawesome/free-solid-svg-icons";

export default function Chatbot() {
  const messagesEndRef = useRef(null);
  const sessionId = useRef(uuidv4());
  const lastBotMessageRef = useRef("");

  // Get user-specific localStorage key
  const getUserKey = (baseKey) => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        const userId = userData._id || userData.id;
        return `${baseKey}_${userId}`;
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    return `${baseKey}_guest`;
  };

  const [messages, setMessages] = useState(() => {
    // Load saved messages from localStorage with expiry check
    const messagesKey = getUserKey("chatbotMessages");
    const timestampKey = getUserKey("chatbotMessagesTimestamp");

    const saved = localStorage.getItem(messagesKey);
    const savedTimestamp = localStorage.getItem(timestampKey);

    if (saved && savedTimestamp) {
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      const now = Date.now();
      const timestamp = parseInt(savedTimestamp, 10);

      // Check if data is older than 3 days
      if (now - timestamp > threeDaysInMs) {
        // Clear expired data
        localStorage.removeItem(messagesKey);
        localStorage.removeItem(timestampKey);
        localStorage.removeItem(getUserKey("chatbotHasUserMessaged"));
        return [];
      }

      return JSON.parse(saved);
    }

    return [];
  });
  const [hasUserMessaged, setHasUserMessaged] = useState(() => {
    // Load saved state from localStorage
    const hasMessagedKey = getUserKey("chatbotHasUserMessaged");
    const saved = localStorage.getItem(hasMessagedKey);
    return saved ? JSON.parse(saved) : false;
  });
  const [input, setInput] = useState("");
  const [botEntries, setBotEntries] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Save messages to localStorage whenever they change with timestamp
  useEffect(() => {
    if (messages.length > 0) {
      const messagesKey = getUserKey("chatbotMessages");
      const timestampKey = getUserKey("chatbotMessagesTimestamp");
      localStorage.setItem(messagesKey, JSON.stringify(messages));
      localStorage.setItem(timestampKey, Date.now().toString());
    }
  }, [messages]);

  // Save hasUserMessaged state to localStorage
  useEffect(() => {
    const hasMessagedKey = getUserKey("chatbotHasUserMessaged");
    localStorage.setItem(hasMessagedKey, JSON.stringify(hasUserMessaged));
  }, [hasUserMessaged]);

  // Clear chat when user changes (logout/login)
  useEffect(() => {
    const currentUserKey = getUserKey("chatbotMessages");
    const savedKey = sessionStorage.getItem("currentChatUserKey");

    if (savedKey && savedKey !== currentUserKey) {
      // User has changed, reset chat
      setMessages([]);
      setHasUserMessaged(false);
      setInput("");
    }

    // Store current user key
    sessionStorage.setItem("currentChatUserKey", currentUserKey);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-speak new bot messages
  useEffect(() => {
    if (!ttsEnabled) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      lastMessage.content !== "__loading__" &&
      lastMessage.content !== lastBotMessageRef.current
    ) {
      lastBotMessageRef.current = lastMessage.content;
      speakMessage(lastMessage.content, messages.length - 1);
    }
  }, [messages, ttsEnabled]);

  // Load knowledge base
  useEffect(() => {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    axios
      .get(`${API_BASE_URL}/bot`)
      .then((res) => setBotEntries(res.data))
      .catch((err) => console.error("Error fetching bot entries:", err));
  }, []);

  // OpenAI is always ready via backend API
  // No initialization needed

  // Initialize Speech Recognition
  useEffect(() => {
    return () => {
      // stop any audio when chatbot unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US"; // Default to English, will be updated dynamically

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const detectLanguage = (text) => {
    if (!text) return "english";
    const filipinoWords = [
      "po",
      "opo",
      "kayo",
      "ako",
      "ka",
      "na",
      "ng",
      "siya",
      "kami",
      "sila",
      "ba",
      "pa",
      "mga",
      "wala",
      "ito",
      "iyan",
      "iyon",
      "paano",
      "saan",
      "ano",
      "gusto",
      "salamat",
      "magandang",
      "araw",
      "gabi",
      "oo",
      "hindi",
      "sino",
    ];
    const words = text.toLowerCase().split(/\W+/);
    const startsWithFilipino = [
      "sino",
      "ano",
      "paano",
      "saan",
      "bakit",
      "kailan",
    ].some((q) => text.toLowerCase().startsWith(q));
    let filipinoCount = 0,
      englishCount = 0;
    words.forEach((w) => {
      if (filipinoWords.includes(w)) filipinoCount++;
      else if (w.match(/^[a-z]+$/)) englishCount++;
    });
    if (startsWithFilipino) return "filipino";
    // If at least 3 Filipino words or more Filipino than English words → Filipino
    if (filipinoCount >= 3 || filipinoCount > englishCount) return "filipino";
    return "english";
  };

  const buildKnowledgeText = (entries) =>
    entries
      .map(
        (e, i) =>
          `${i + 1}.\nEN: ${e.info_en}\nFIL: ${
            e.info_fil || "N/A"
          }\nKeywords: ${e.keywords.join(", ")}`
      )
      .join("\n\n");

  const speakMessage = async (text, messageIndex) => {
    if (!text || text === "__loading__") return;

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const lang = detectLanguage(text);
      setSpeakingMessageIndex(messageIndex);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/tts/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang })
      });
      if (!res.ok) throw new Error('TTS request failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeakingMessageIndex(null);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setSpeakingMessageIndex(null);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.play();
    } catch (err) {
      console.error('TTS playback error:', err);
      setSpeakingMessageIndex(null);
    }
  };

  const toggleTTS = () => {
    const newState = !ttsEnabled;
    setTtsEnabled(newState);
    if (!newState) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setSpeakingMessageIndex(null);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingMessageIndex(null);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Detect language preference from last message or default to English
      const lastUserMessage = messages
        .filter((m) => m.role === "user")
        .slice(-1)[0];
      if (lastUserMessage) {
        const lang = detectLanguage(lastUserMessage.content);
        recognitionRef.current.lang = lang === "filipino" ? "fil-PH" : "en-US";
      }

      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  const handleSend = async (quickQuestion = null) => {
    const messageToSend = quickQuestion || input.trim();
    if (!messageToSend || isBotTyping) return;

    // Mark that user has sent a message
    if (!hasUserMessaged) {
      setHasUserMessaged(true);
    }

    const userMessage = messageToSend;

    // Clear input field
    setInput("");

    // Add user message and loading state
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "__loading__" },
    ]);
    setIsBotTyping(true);

    try {
      // Check with OpenAI Moderation API
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      const moderationResponse = await axios.post(
        `${API_BASE_URL}/openai/moderate`,
        {
          input: userMessage,
        }
      );

      // If content is flagged, replace loading message with warning
      if (
        moderationResponse.data.results &&
        moderationResponse.data.results[0] &&
        moderationResponse.data.results[0].flagged
      ) {
        // Get the flagged categories
        const categories = moderationResponse.data.results[0].categories;
        const categoryScores =
          moderationResponse.data.results[0].category_scores;
        const flaggedCategories = Object.keys(categories).filter(
          (key) => categories[key]
        );

        console.log("Content flagged by OpenAI Moderation API:", {
          flaggedCategories,
          categoryScores: flaggedCategories.reduce((acc, category) => {
            acc[category] = categoryScores[category];
            return acc;
          }, {}),
        });

        // Create a more specific message based on flagged categories
        let warningMessage =
          "⚠️ Your message was flagged by our content moderation system. ";

        if (
          flaggedCategories.includes("violence") ||
          flaggedCategories.includes("violence/graphic")
        ) {
          warningMessage += "Please avoid violent content. ";
        }

        if (
          flaggedCategories.includes("sexual") ||
          flaggedCategories.includes("sexual/minors")
        ) {
          warningMessage += "Please avoid inappropriate sexual content. ";
        }

        if (
          flaggedCategories.includes("hate") ||
          flaggedCategories.includes("hate/threatening")
        ) {
          warningMessage += "Please avoid hateful or discriminatory language. ";
        }

        if (
          flaggedCategories.includes("harassment") ||
          flaggedCategories.includes("harassment/threatening")
        ) {
          warningMessage += "Please avoid harassing or threatening language. ";
        }

        if (
          flaggedCategories.includes("self-harm") ||
          flaggedCategories.includes("self-harm/intent") ||
          flaggedCategories.includes("self-harm/instructions")
        ) {
          warningMessage += "Please avoid content related to self-harm. ";
        }

        warningMessage += "Let's keep our conversation respectful.";

        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1
              ? { role: "assistant", content: warningMessage }
              : msg
          )
        );
        setIsBotTyping(false);
        return;
      }

      // Continue with normal processing if content is not flagged
    } catch (error) {
      console.error("Error checking content with moderation API:", error);

      // Apply basic profanity filter as fallback when moderation API fails
      const basicProfanityList = [
        "fuck",
        "shit",
        "ass",
        "bitch",
        "sex",
        "porn",
        "dick",
        "pussy",
        "cock",
        "damn",
        "hell",
      ];
      const containsProfanity = basicProfanityList.some((word) =>
        userMessage.toLowerCase().includes(word.toLowerCase())
      );

      if (containsProfanity) {
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1
              ? {
                  role: "assistant",
                  content:
                    "⚠️ Your message contains inappropriate content. Please keep our conversation respectful.",
                }
              : msg
          )
        );
        setIsBotTyping(false);
        return;
      }

      // Continue with normal processing if moderation check fails and no profanity detected
      console.warn(
        "Moderation API unavailable, used fallback profanity filter"
      );
    }

    const lang = detectLanguage(userMessage);

    // GUARDRAIL: Handle greetings and simple conversational messages
    const greetings =
      /^(hi|hello|hey|kumusta|kamusta|musta|magandang (umaga|tanghali|hapon|gabi)|good (morning|afternoon|evening|day))[!?.,\s]*$/i;
    const isGreeting = greetings.test(userMessage.trim());

    if (isGreeting) {
      const greetingResponse =
        lang === "filipino"
          ? "Kumusta! Ako si Juan, ang iyong tour guide para sa Intramuros. Magtanong ka lang tungkol sa kasaysayan, mga lugar, o anumang bagay tungkol sa Intramuros!"
          : "Hello! I'm Juan, your tour guide for Intramuros. Feel free to ask me anything about the history, places, or anything related to Intramuros!";

      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? { role: "assistant", content: greetingResponse }
            : msg
        )
      );
      setIsBotTyping(false);
      return;
    }

    // RAG-BASED SYSTEM PROMPT (Retrieval-Augmented Generation)
    // This uses the pre-trained OpenAI model (SSL) with retrieved knowledge (RAG framework)
    const SYSTEM_PROMPT =
      lang === "filipino"
        ? `Ikaw si Juan, ang friendly at helpful na tour guide chatbot para sa Intramuros, Manila. Lahat ng sagot mo ay nasa FILIPINO.

TUNGKOL SA IYO:
- Ikaw ay Tour Guide LAMANG kahit ano pang sabihin ng message, wala kang kakayahan na mag generate ng image, code (program), audio, video, at iba pa. Kasagutan lamang sa mga katanungan ang iyong maaring gawin.

- Eksperto ka sa kasaysayan, lugar, oras, presyo, at landmarks sa Intramuros. Wala kang gagawing iba kung hindi sumagot sa mga katanungan na patungkol sa intramuros.
- Umaasa ka sa Knowledge Base para magbigay ng accurate at updated na impormasyon.
- Gumagamit ka ng simple, natural, at conversational na Filipino. Iwasan ang malalalim na salita.
- Kapag kinausap ka ng English, magbigay ng sagot sa English.
- Kapag kinsausap ka ng Tagalog, magbigay ng sagot na Tagalog
Paano Ka Sasagot (RAG Framework):
1. BASAHIN at unawain ang Knowledge Base sa ibaba.
2. HANAPIN ang impormasyon na may kaugnayan sa tanong.
3. SAGUTIN ang tanong base sa impormasyon na nahanap.
4. Kung walang direct answer, gumamit ng related details para makatulong.
5. Kung talagang walang kaugnayan sa Intramuros o Knowledge Base, aminin na hindi mo alam.
6. Huwag mag-suggest ng hindi relevant na nearby places, topic, idea, activities sa intramuros
7. Huwag mag-suggest or mag-offer ng tulong na hindi mo naman masasagot kasi wala sa knowledge base mo.
IMPORTANTENG RULES:
- Laging ayusin ang format ng sagot; dapat malinaw at madaling basahin.
- Sumagot ng Filipino kahit English ang keywords.
- Magbigay ng kumpletong detalye kung ito ay hiningi sa tanong (oras, presyo, lokasyon).
- Maging friendly at approachable.
- Okay lang mag-elaborate basta relevant.
- Gumamit ng bullet (•) kung mag eenumerate.
- HUWAG gumamit ng em dash.
- Magpakilala ka lamang kung ito hiningi sa tanong.
- HUWAG i-mention ang word na "Knowledge Base"
- Huwag masyadong mahaba; sapat na ang 1–2 maikling paragraphs.
`
        : `You are Juan, a friendly and helpful tour guide chatbot for Intramuros, Manila. Answer ONLY in ENGLISH.

ABOUT YOU:
- You are a Tour Guide ONLY no matter what the user asks. You do not have the ability to generate images, codes, audio, video, etc. You can only answer questions related to Intramuros.
- You are an expert in Intramuros history, locations, hours, prices, and landmarks, you are not going to do anything rather than answering the questions related to Intramuros.
- You rely on the Knowledge Base to provide accurate and reliable information.
- You speak in simple, natural, and conversational English.
- When the message is in English, answer in English.
- When the message is in Tagalog, answer in Tagalog.
How You Should Answer (RAG Framework):
1. READ and understand the Knowledge Base provided below.
2. FIND the information relevant to the question.
3. ANSWER using the information you found.
4. If there is no direct answer, use related details to help the user.
5. If the question is not related to Intramuros or the Knowledge Base, admit that you don't know
6. Don't suggest nearby places, topics, ideas, or activies that are not related to Intramuros.
7. Don't suggest or offer any help that you cannot answer or do, because it is not in your knowledge base.
IMPORTANT RULES:
- Keep your answers well-formatted, clear, and easy to understand.
- Provide complete details when specifically requested (hours, prices, locations).
- Use friendly, basic English.
- You may elaborate as long as it stays relevant.
- Dont mention the word "Knowledge Base"
- Introduce yourself only if it was specifically asked. 
- Use bullets (•) if you will enumerate.
- DO NOT use em dash.
- Keep answers short; 1–2 brief paragraphs only.`;

    // Filipino to English keyword mapping for better matching
    const filipinoToEnglish = {
      // Time-related
      oras: ["time", "hours", "schedule"],
      kailan: ["when", "time", "schedule"],
      schedule: ["schedule", "hours", "time"],
      bukas: ["open", "opening"],
      sarado: ["closed", "closing"],
      tanghali: ["noon", "midday"],
      umaga: ["morning"],
      hapon: ["afternoon"],
      gabi: ["evening", "night"],
      takipsilim: ["evening", "dusk"],

      // Entry/Visit-related
      pumasok: ["enter", "entrance", "entry", "visit"],
      bisita: ["visit", "tour"],
      pumunta: ["go", "visit"],
      entrance: ["entrance", "entry"],
      pasok: ["enter", "entrance", "entry"],
      papasok: ["enter", "entrance"],

      // Fee/Cost-related
      bayad: ["fee", "cost", "price", "entrance"],
      presyo: ["price", "cost", "fee"],
      magkano: ["cost", "price", "fee", "how much"],
      libre: ["free"],
      halaga: ["cost", "price", "fee"],

      // Location-related
      saan: ["where", "location"],
      lugar: ["place", "location"],
      lokasyon: ["location", "place"],
      nasaan: ["where", "location"],

      // General question words
      ano: ["what"],
      anong: ["what"],
      paano: ["how"],
      bakit: ["why"],
      sino: ["who"],

      // Common places
      simbahan: ["church"],
      museo: ["museum"],
      fort: ["fort"],
      kuta: ["fort"],
      plaza: ["plaza"],
      bahay: ["house"],
      gusali: ["building"],

      // Actions
      makita: ["see", "view"],
      gawin: ["do"],
      maglakad: ["walk"],
      kumain: ["eat"],
      tingnan: ["see", "view", "look"],

      // Descriptors
      maganda: ["beautiful"],
      malapit: ["near", "close"],
      malayo: ["far"],
      importante: ["important"],
      sikat: ["famous"],
      tanyag: ["famous"],
      kilala: ["known", "famous"],
      bantog: ["famous"],

      // Other
      pwede: ["can", "allowed"],
      puwede: ["can", "allowed"],
      kailangan: ["need"],
      gusto: ["want"],
      may: ["have"],
      meron: ["have"],
      mayroon: ["have"],
    };

    // Extract user keywords and translate Filipino words to English
    let userKeywords = userMessage.toLowerCase().split(/\W+/).filter(Boolean);

    // Add English translations of Filipino keywords (flatten arrays)
    const translatedKeywords = userKeywords.flatMap(
      (kw) => filipinoToEnglish[kw] || []
    );

    // Combine original and translated keywords for better matching
    userKeywords = [...userKeywords, ...translatedKeywords];

    // Relevance scoring: count how many keywords match per entry
    const scoredEntries = botEntries
      .map((entry) => {
        const entryKeywords = entry.keywords.map((k) => k.toLowerCase());
        const matchCount = userKeywords.reduce(
          (count, kw) => (entryKeywords.includes(kw) ? count + 1 : count),
          0
        );
        return { entry, matchCount };
      })
      .filter((e) => e.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount) // highest relevance first
      .slice(0, 5) // take top 5 entries
      .map((e) => e.entry);

    // FALLBACK: If no exact matches, check for general Intramuros questions
    let knowledgeText = "";
    if (scoredEntries.length === 0) {
      const generalTerms = [
        "intramuros",
        "manila",
        "history",
        "kasaysayan",
        "lugar",
        "place",
        "tourist",
        "turista",
        "visit",
        "bisita",
      ];
      const hasGeneralTerm = userKeywords.some((kw) =>
        generalTerms.includes(kw)
      );

      if (hasGeneralTerm && botEntries.length > 0) {
        // Provide top 3 entries for general context
        knowledgeText = buildKnowledgeText(botEntries.slice(0, 3));
      } else {
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1
              ? {
                  role: "assistant",
                  content:
                    lang === "filipino"
                      ? "Pasensya na, wala akong detalyadong impormasyon tungkol diyan. Mayroon ka bang ibang tanong tungkol sa Intramuros?"
                      : "Sorry, I don't have detailed information about that. Do you have any other questions about Intramuros?",
                }
              : msg
          )
        );
        setIsBotTyping(false);
        return;
      }
    } else {
      knowledgeText = buildKnowledgeText(scoredEntries);
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\n=== KNOWLEDGE BASE ===\n${knowledgeText}\n\n=== USER QUESTION ===\n${userMessage}\n\nPlease answer the question above using the Knowledge Base. Be helpful and conversational!`;

    try {
      // Call backend OpenAI API with GPT-5 mini model (non-streaming)
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

      const response = await fetch(`${API_BASE_URL}/openai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: fullPrompt },
            { role: "user", content: userMessage },
          ],
          model: "gpt-5-mini",
          max_completion_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error("OpenAI request failed");
      }

      const data = await response.json();

      // Update the last message with the response
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? { role: "assistant", content: data.message }
            : msg
        )
      );
    } catch (err) {
      console.error("OpenAI API error:", err);

      // Fallback: try Gemini via backend proxy
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

        const geminiRes = await fetch(`${API_BASE_URL}/gemini/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            system: fullPrompt,
            user: userMessage,
          }),
        });

        if (!geminiRes.ok) {
          throw new Error("Gemini request failed");
        }

        const geminiData = await geminiRes.json();

        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1
              ? { role: "assistant", content: geminiData.message }
              : msg
          )
        );
      } catch (fallbackErr) {
        console.error("Gemini fallback error:", fallbackErr);
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1
              ? {
                  role: "assistant",
                  content:
                    lang === "filipino"
                      ? "Pasensya na, nagkaproblema si Juan. Pakisubukang muli."
                      : "Sorry, Juan ran into a problem. Please try again.",
                }
              : msg
          )
        );
      }
    } finally {
      setIsBotTyping(false);
    }
  };

  // Quick question suggestions
  const quickQuestions = [
    "What are the must-see places in Intramuros?",
    "Tell me about Fort Santiago",
    "What's the history of Intramuros?",
    "Where can I eat in Intramuros?",
    "How do I get to Manila Cathedral?",
    "What are the entrance fees?",
  ];

  const handleQuickQuestion = (question) => {
    setInput(question);
    // Auto-send the question
    setTimeout(() => {
      handleSend(question);
    }, 100);
  };

  return (
    <div
      className="flex flex-col w-full h-full p-5 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl"
      style={{
        paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
      }}
    >
      <style>{`
        @media screen and (max-width: 768px) {
          input:focus {
            font-size: 16px !important;
          }
        }
      `}</style>
      <div className="flex-1 overflow-y-auto mb-4 p-4 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex items-end gap-2 max-w-[85%] ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar for assistant messages */}
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#f04e37] to-[#e03d2d] flex items-center justify-center shadow-md mb-1">
                  <span className="text-white text-sm font-bold">J</span>
                </div>
              )}

              <div
                className={`relative ${msg.role === "user" ? "" : "flex-1"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl shadow-md transition-all duration-300 animate-fadeIn ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[#f04e37] to-[#f04e37] text-white rounded-br-none"
                      : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900 rounded-bl-none pr-10"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.content === "__loading__" ? (
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-[#f04e37] rounded-full animate-pulse"
                          style={{
                            animationDelay: "0ms",
                            animationDuration: "1.4s",
                          }}
                        />
                        <div
                          className="w-2 h-2 bg-[#f04e37] rounded-full animate-pulse"
                          style={{
                            animationDelay: "200ms",
                            animationDuration: "1.4s",
                          }}
                        />
                        <div
                          className="w-2 h-2 bg-[#f04e37] rounded-full animate-pulse"
                          style={{
                            animationDelay: "400ms",
                            animationDuration: "1.4s",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 ml-1">
                        Juan is typing
                      </span>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Speaker button inside assistant bubble */}
                {msg.role === "assistant" && msg.content !== "__loading__" && (
                  <button
                    onClick={() => speakMessage(msg.content, i)}
                    className={`absolute top-2 right-2 p-1 rounded-full transition-all ${
                      speakingMessageIndex === i
                        ? "bg-[#f04e37]/10 text-[#f04e37]"
                        : "text-gray-400 hover:text-[#f04e37] hover:bg-gray-100/50"
                    }`}
                    title="Listen to message"
                  >
                    <FontAwesomeIcon icon={faVolumeUp} className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Vertical Quick Questions - Show only if no user messages yet */}
        {!hasUserMessaged && messages.length === 0 && (
          <div className="space-y-3 animate-fadeIn">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide px-2">
              Quick Questions:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-700 hover:border-[#f04e37] hover:bg-[#fff5f3] transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  <span className="group-hover:text-[#f04e37] transition-colors">
                    {question}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Horizontal Scrollable Quick Questions - Show only after user has messaged */}
        {hasUserMessaged && (
          <div className="mt-4 overflow-hidden">
            <div
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(question)}
                  className="flex-shrink-0 px-4 py-2 bg-white border-2 border-gray-200 rounded-full text-xs text-gray-700 hover:border-[#f04e37] hover:bg-[#fff5f3] hover:text-[#f04e37] transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-2 shadow-md">
        <button
          onClick={toggleListening}
          disabled={isBotTyping}
          className={`p-2 rounded-full transition-all ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-transparent text-gray-600 hover:bg-gray-200"
          }`}
          title={isListening ? "Stop listening" : "Speak your message"}
        >
          <FontAwesomeIcon
            icon={isListening ? faStop : faMicrophone}
            className="w-4 h-4"
            style={{ color: isListening ? "white" : "#f04e37" }}
          />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isBotTyping || isListening}
          className="flex-grow bg-transparent outline-none px-2 py-1 text-base"
          style={{ fontSize: "16px" }}
          placeholder={
            isBotTyping
              ? "Juan is typing..."
              : isListening
              ? "Listening..."
              : "Ask Juan about Intramuros..."
          }
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            handleSend();
          }}
          disabled={isBotTyping || !input.trim()}
          className="bg-transparent"
        >
          <div className="transform rotate-45">
            <FontAwesomeIcon
              icon={faPaperPlane}
              className="w-5 h-5"
              style={{ color: "#f04e37" }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
