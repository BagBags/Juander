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

  const [messages, setMessages] = useState([]);
  const [hasUserMessaged, setHasUserMessaged] = useState(false);
  const [input, setInput] = useState("");
  const [botEntries, setBotEntries] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

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
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    axios
      .get(`${apiBaseUrl}/bot`)
      .then((res) => setBotEntries(res.data))
      .catch((err) => console.error("Error fetching bot entries:", err));
  }, []);

  // OpenAI is always ready via backend API
  // No initialization needed

  // Initialize Speech Recognition
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
    return startsWithFilipino
      ? "filipino"
      : filipinoCount >= englishCount
      ? "filipino"
      : "english";
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

  const speakMessage = (text, messageIndex) => {
    if (!text || text === "__loading__") return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Detect language and set appropriate voice
    const lang = detectLanguage(text);
    utterance.lang = lang === "filipino" ? "fil-PH" : "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setSpeakingMessageIndex(messageIndex);
    };

    utterance.onend = () => {
      setSpeakingMessageIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageIndex(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const toggleTTS = () => {
    const newState = !ttsEnabled;
    setTtsEnabled(newState);
    if (!newState) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIndex(null);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
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
    if (!quickQuestion) {
      setInput("");
    }
    // Add user message and loading state
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "__loading__" },
    ]);
    setInput("");
    setIsBotTyping(true);
    
    try {
      // Check with OpenAI Moderation API
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const moderationResponse = await axios.post(`${apiBaseUrl}/openai/moderate`, {
        input: userMessage
      });
      
      // If content is flagged, replace loading message with warning
      if (moderationResponse.data.results && 
          moderationResponse.data.results[0] && 
          moderationResponse.data.results[0].flagged) {
        
        // Get the flagged categories
        const categories = moderationResponse.data.results[0].categories;
        const categoryScores = moderationResponse.data.results[0].category_scores;
        const flaggedCategories = Object.keys(categories).filter(key => categories[key]);
        
        console.log('Content flagged by OpenAI Moderation API:', {
          flaggedCategories,
          categoryScores: flaggedCategories.reduce((acc, category) => {
            acc[category] = categoryScores[category];
            return acc;
          }, {})
        });
        
        // Create a more specific message based on flagged categories
        let warningMessage = "⚠️ Your message was flagged by our content moderation system. ";
        
        if (flaggedCategories.includes("violence") || flaggedCategories.includes("violence/graphic")) {
          warningMessage += "Please avoid violent content. ";
        }
        
        if (flaggedCategories.includes("sexual") || flaggedCategories.includes("sexual/minors")) {
          warningMessage += "Please avoid inappropriate sexual content. ";
        }
        
        if (flaggedCategories.includes("hate") || flaggedCategories.includes("hate/threatening")) {
          warningMessage += "Please avoid hateful or discriminatory language. ";
        }
        
        if (flaggedCategories.includes("harassment") || flaggedCategories.includes("harassment/threatening")) {
          warningMessage += "Please avoid harassing or threatening language. ";
        }
        
        if (flaggedCategories.includes("self-harm") || 
            flaggedCategories.includes("self-harm/intent") || 
            flaggedCategories.includes("self-harm/instructions")) {
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
      const basicProfanityList = ["fuck", "shit", "ass", "bitch", "sex", "porn", "dick", "pussy", "cock", "damn", "hell"];
      const containsProfanity = basicProfanityList.some(word => 
        userMessage.toLowerCase().includes(word.toLowerCase())
      );
      
      if (containsProfanity) {
        setMessages((prev) => 
          prev.map((msg, i) => 
            i === prev.length - 1 
              ? { role: "assistant", content: "⚠️ Your message contains inappropriate content. Please keep our conversation respectful." }
              : msg
          )
        );
        setIsBotTyping(false);
        return;
      }
      
      // Continue with normal processing if moderation check fails and no profanity detected
      console.warn("Moderation API unavailable, used fallback profanity filter");
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
        ? `Ikaw si Juan, ang tour guide chatbot para sa Intramuros, Manila. Sumagot ka ng FILIPINO.

TUNGKOL SA IYO:
- Ikaw ay friendly at helpful na tour guide
- Eksperto ka tungkol sa Intramuros
- Gumagamit ka ng Knowledge Base para sa accurate na impormasyon

PAANO KA SUMAGOT (RAG Framework):
1. BASAHIN ang Knowledge Base na ibinigay sa ibaba
2. HANAPIN ang relevant na impormasyon para sa tanong
3. SAGUTIN ang tanong gamit ang nahanap mong impormasyon
4. Kung may kaugnayan sa Knowledge Base, gamitin ito para sumagot
5. Kung walang direktang sagot, gamitin ang related information para magbigay ng helpful na tugon
6. Maging natural at conversational - huwag masyadong strict
7. Kung talagang walang kaugnayan sa Intramuros o Knowledge Base, aminin na hindi mo alam at mag-alok ng tulong sa iba pang tanong

IMPORTANTE:
- Sumagot ng FILIPINO kahit English ang keywords
- Magbigay ng complete details (oras, presyo, lokasyon)
- Maging friendly at approachable
- Okay lang mag-elaborate base sa available information`
        : `You are Juan, a friendly tour guide chatbot for Intramuros, Manila. Answer in ENGLISH.

ABOUT YOU:
- You are a friendly and helpful tour guide
- You are an expert on Intramuros
- You use a Knowledge Base to provide accurate information

HOW TO ANSWER (RAG Framework):
1. READ the Knowledge Base provided below
2. FIND relevant information for the question
3. ANSWER the question using the information you found
4. If there's related information in the Knowledge Base, use it to answer
5. If there's no direct answer, use related information to provide a helpful response
6. Be natural and conversational - don't be overly strict
7. If the question is truly unrelated to Intramuros or the Knowledge Base, admit you don't know and offer to help with other questions

IMPORTANT:
- Provide complete details (hours, prices, locations)
- Be friendly and approachable
- It's okay to elaborate based on available information`;

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
                      ? "Pasensya na, wala akong detalyadong impormasyon tungkol diyan sa aking knowledge base. Mayroon ka bang ibang tanong tungkol sa Intramuros?"
                      : "Sorry, I don't have detailed information about that in my knowledge base. Do you have any other questions about Intramuros?",
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
      // Call backend OpenAI API with GPT-5 mini model
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      
      const response = await axios.post(`${API_BASE_URL}/openai/chat`, {
        messages: [
          { role: "system", content: fullPrompt },
          { role: "user", content: userMessage },
        ],
        model: "gpt-5-mini", // Specify GPT-5 mini model
        max_completion_tokens: 2000,
      });

      console.log("OpenAI response:", response.data);
      const reply = response.data.message;

      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 ? { role: "assistant", content: reply } : msg
        )
      );
    } catch (err) {
      console.error("OpenAI API error:", err);
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
      <div className="flex-1 overflow-y-auto mb-4 p-4 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm space-y-4">
        {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar for assistant messages */}
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#f04e37] to-[#e03d2d] flex items-center justify-center shadow-md mb-1">
                    <span className="text-white text-sm font-bold">J</span>
                  </div>
                )}
                
                <div className={`relative ${msg.role === "user" ? "" : "flex-1"}`}>
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
                          <div className="w-2 h-2 bg-[#f04e37] rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1.4s' }} />
                          <div className="w-2 h-2 bg-[#f04e37] rounded-full animate-pulse" style={{ animationDelay: '200ms', animationDuration: '1.4s' }} />
                          <div className="w-2 h-2 bg-[#f04e37] rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '1.4s' }} />
                        </div>
                        <span className="text-xs text-gray-500 ml-1">Juan is typing</span>
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
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide px-2">Quick Questions:</p>
            <div className="grid grid-cols-1 gap-2">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-700 hover:border-[#f04e37] hover:bg-[#fff5f3] transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  <span className="group-hover:text-[#f04e37] transition-colors">{question}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Horizontal Scrollable Quick Questions - Show only after user has messaged */}
        {hasUserMessaged && (
          <div className="mt-4 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isBotTyping || isListening}
          className="flex-grow bg-transparent outline-none px-2 py-1 text-sm sm:text-base"
          placeholder={
            isBotTyping
              ? "Juan is typing..."
              : isListening
              ? "Listening..."
              : "Ask Juan about Intramuros..."
          }
        />
        <button
          onClick={handleSend}
          disabled={isBotTyping}
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
