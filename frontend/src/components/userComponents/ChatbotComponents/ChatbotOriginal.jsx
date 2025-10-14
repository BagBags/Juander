import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Filter } from "bad-words";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faVolumeUp, faVolumeMute, faMicrophone, faStop } from "@fortawesome/free-solid-svg-icons";

const filter = new Filter();
filter.addWords(
  "putangina",
  "putang ina",
  "tanginamo",
  "anak ng puta",
  "pakyu",
  "pekpek",
  "puke",
  "burat",
  "pwets",
  "ulol",
  "gago",
  "gaga",
  "tanga",
  "bobo",
  "tarantado",
  "hayop",
  "loko",
  "lokohan",
  "pucha",
  "puchang ina",
  "pakshet",
  "gago ka",
  "tangina mo",
  "putangi mo",
  "ulol ka",
  "tanga ka"
);

export default function Chatbot() {
  const messagesEndRef = useRef(null);
  const sessionId = useRef(uuidv4());
  const lastBotMessageRef = useRef("");

  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Welcome! Ask me anything about Intramuros in English or Filipino.",
    },
  ]);
  const [input, setInput] = useState("");
  const [botEntries, setBotEntries] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [puterReady, setPuterReady] = useState(false);
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
    axios
      .get("/api/bot")
      .then((res) => setBotEntries(res.data))
      .catch((err) => console.error("Error fetching bot entries:", err));
  }, []);

  // Initialize Puter.js and wait until AI is ready
  useEffect(() => {
    const initPuter = () => {
      if (window.puter && window.puter.ai) {
        setPuterReady(true);
      } else {
        const script = document.createElement("script");
        script.src = "https://js.puter.com/v2/";
        script.onload = () => {
          const waitForAI = () => {
            if (window.puter.ai) setPuterReady(true);
            else setTimeout(waitForAI, 100);
          };
          waitForAI();
        };
        document.body.appendChild(script);
      }
    };
    initPuter();
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US'; // Default to English, will be updated dynamically
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
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
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Detect language preference from last message or default to English
      const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0];
      if (lastUserMessage) {
        const lang = detectLanguage(lastUserMessage.content);
        recognitionRef.current.lang = lang === 'filipino' ? 'fil-PH' : 'en-US';
      }
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isBotTyping || !puterReady) return;

    const userMessage = input.trim();
    if (filter.isProfane(userMessage)) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        {
          role: "assistant",
          content: "⚠️ Please avoid using inappropriate language.",
        },
      ]);
      setInput("");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "__loading__" },
    ]);
    setInput("");
    setIsBotTyping(true);

    const lang = detectLanguage(userMessage);
    const SYSTEM_PROMPT =
      lang === "filipino"
        ? `You are Juan, a Filipino tour guide chatbot for Intramuros. Answer ONLY from the knowledge base. If not found, reply: "Pasensya na, wala akong impormasyon tungkol diyan sa aking knowledge base." Always answer in Filipino.`
        : `You are Juan, an English-speaking tour guide chatbot for Intramuros. Answer ONLY from the knowledge base. If not found, reply: "Sorry, I don’t have information about that in my knowledge base." Always answer in English.`;

    const userKeywords = userMessage.toLowerCase().split(/\W+/).filter(Boolean);

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

    if (scoredEntries.length === 0) {
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            ? {
                role: "assistant",
                content:
                  lang === "filipino"
                    ? "Pasensya na, wala akong impormasyon tungkol diyan sa aking knowledge base."
                    : "Sorry, I don’t have information about that in my knowledge base.",
              }
            : msg
        )
      );
      setIsBotTyping(false);
      return;
    }

    const knowledgeText = buildKnowledgeText(scoredEntries);
    const fullPrompt = `${SYSTEM_PROMPT}\n\nKnowledge Base:\n${knowledgeText}\n\nUser: ${userMessage}`;

    try {
      console.log("Puter AI object:", window.puter.ai);
      const response = await window.puter.ai.chat(fullPrompt, {
        model: "gpt-5",
        temperature: 0,
        max_tokens: 500,
      });
      console.log("Puter.js response:", response);

      const reply =
        typeof response === "string"
          ? response
          : response?.message?.content || JSON.stringify(response);

      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1 ? { role: "assistant", content: reply } : msg
        )
      );
    } catch (err) {
      console.error("Puter.js API error:", err);
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

  return (
    <div className="flex flex-col w-full h-full p-5 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl">
      {/* TTS Toggle Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={toggleTTS}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            ttsEnabled
              ? "bg-[#f04e37] text-white hover:bg-[#e03d2d]"
              : "bg-gray-300 text-gray-600 hover:bg-gray-400"
          }`}
          title={ttsEnabled ? "Disable voice" : "Enable voice"}
        >
          <FontAwesomeIcon icon={ttsEnabled ? faVolumeUp : faVolumeMute} className="mr-1" />
          {ttsEnabled ? "Voice On" : "Voice Off"}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto mb-4 p-4 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm space-y-4">
        {messages
          .filter((m) => m.role !== "system")
          .map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className="flex items-end gap-2 max-w-[85%]">
                {msg.role === "assistant" && (
                  <button
                    onClick={() => speakMessage(msg.content, i)}
                    disabled={msg.content === "__loading__"}
                    className={`mb-1 p-1.5 rounded-full transition-all ${
                      speakingMessageIndex === i
                        ? "bg-[#f04e37] text-white animate-pulse"
                        : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Speak message"
                  >
                    <FontAwesomeIcon icon={faVolumeUp} className="w-3 h-3" />
                  </button>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl shadow-md transition-all duration-300 animate-fadeIn ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[#f04e37] to-[#f04e37] text-white rounded-br-none"
                      : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900 rounded-bl-none"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.content === "__loading__" ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-150" />
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-300" />
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-2 shadow-md">
        <button
          onClick={toggleListening}
          disabled={isBotTyping || !puterReady}
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
          disabled={isBotTyping || !puterReady || isListening}
          className="flex-grow bg-transparent outline-none px-2 py-1 text-sm sm:text-base"
          placeholder={
            !puterReady
              ? "Initializing Juan…"
              : isBotTyping
              ? "Juan is typing..."
              : isListening
              ? "Listening..."
              : "Type or speak your message..."
          }
        />
        <button
          onClick={handleSend}
          disabled={isBotTyping || !puterReady}
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
