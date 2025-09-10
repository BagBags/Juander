import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Filter } from "bad-words";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const filter = new Filter();
filter.addWords(
  "putangina","putang ina","tanginamo","anak ng puta","pakyu",
  "pekpek","puke","burat","pwets","ulol","gago","gaga","tanga",
  "bobo","tarantado","hayop","loko","lokohan","pucha","puchang ina",
  "pakshet","gago ka","tangina mo","putangi mo","ulol ka","tanga ka"
);

export default function Chatbot() {
  const messagesEndRef = useRef(null);
  const sessionId = useRef(uuidv4());

  const [messages, setMessages] = useState([
    { role: "system", content: "Welcome! Ask me anything about Intramuros in English or Filipino." },
  ]);
  const [input, setInput] = useState("");
  const [botEntries, setBotEntries] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load knowledge base
  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await axios.get("/api/bot");
        setBotEntries(res.data);
      } catch (err) {
        console.error("Error fetching bot entries:", err);
      }
    }
    fetchEntries();
  }, []);

  // Language detection
  const detectLanguage = (text) => {
    const filipinoWords = ["po","opo","kayo","ako","ka","na","ng","siya","kami","sila","ba","pa","mga","wala","ito","iyan","iyon","paano","saan","ano","gusto","salamat","magandang","araw","gabi","oo","hindi","sino"];
    const words = text.toLowerCase().split(/\W+/);
    const startsWithFilipino = ["sino","ano","paano","saan","bakit","kailan"].some(q => text.toLowerCase().startsWith(q));

    let filipinoCount = 0, englishCount = 0;
    words.forEach(word => {
      if (filipinoWords.includes(word)) filipinoCount++;
      else if (word.match(/^[a-z]+$/)) englishCount++;
    });

    if (startsWithFilipino) return "filipino";
    return filipinoCount >= englishCount ? "filipino" : "english";
  };

  // Build knowledge text
  const buildKnowledgeText = (entries) =>
    entries
      .map((e, i) => `${i + 1}.\nEN: ${e.info_en}\nFIL: ${e.info_fil || "N/A"}\nKeywords: ${e.keywords.join(", ")}`)
      .join("\n\n");

  // Handle send
  const handleSend = async () => {
    if (!input.trim() || isBotTyping) return;

    const userMessage = input.trim();
    if (filter.isProfane(userMessage)) {
      setMessages(prev => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: "⚠️ Please avoid using inappropriate language." }
      ]);
      setInput("");
      return;
    }

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsBotTyping(true);

    // Add loading indicator
    setMessages(prev => [...prev, { role: "assistant", content: "__loading__" }]);

    const lang = detectLanguage(userMessage);
    const SYSTEM_PROMPT = lang === "filipino"
      ? `You are Juan, a Filipino tour guide chatbot for Intramuros. Answer ONLY from the knowledge base. If not found, reply: "Pasensya na, wala akong impormasyon tungkol diyan sa aking knowledge base." Always answer in Filipino.`
      : `You are Juan, an English-speaking tour guide chatbot for Intramuros. Answer ONLY from the knowledge base. If not found, reply: "Sorry, I don’t have information about that in my knowledge base." Always answer in English.`;

    const keywords = userMessage.toLowerCase().split(/\W+/).filter(Boolean);
    const relevantEntries = botEntries.filter(entry =>
      keywords.some(kw => entry.keywords.some(k => k.toLowerCase().includes(kw))) ||
      entry.info_en.toLowerCase().includes(userMessage.toLowerCase()) ||
      (entry.info_fil && entry.info_fil.toLowerCase().includes(userMessage.toLowerCase()))
    );

    if (relevantEntries.length === 0) {
      setMessages(prev => prev.map((msg, i) =>
        i === prev.length - 1
          ? { role: "assistant", content: lang === "filipino" ? "Pasensya na, wala akong impormasyon tungkol diyan sa aking knowledge base." : "Sorry, I don’t have information about that in my knowledge base." }
          : msg
      ));
      setIsBotTyping(false);
      return;
    }

    const knowledgeText = buildKnowledgeText(relevantEntries);
    const fullPrompt = `${SYSTEM_PROMPT}\n\nKnowledge Base:\n${knowledgeText}\n\nUser: ${userMessage}`;

    if (!window.puter) {
      setMessages(prev => prev.map((msg, i) =>
        i === prev.length - 1 ? { role: "assistant", content: "Juan is still waking up. Please try again shortly." } : msg
      ));
      setIsBotTyping(false);
      return;
    }

    try {
      const response = await window.puter.ai.chat(fullPrompt, {
        model: "gpt-4.1-nano",
        temperature: 0,
        max_tokens: 500,
      });

      const reply = typeof response === "string" ? response : response?.message?.content || JSON.stringify(response);

      // Replace loading with actual reply
      setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { role: "assistant", content: reply } : msg));
    } catch (err) {
      console.error("Puter.js API error:", err);
      setMessages(prev => prev.map((msg, i) =>
        i === prev.length - 1
          ? { role: "assistant", content: "Oops! Juan ran into a problem answering. Please try again later." }
          : msg
      ));
    } finally {
      setIsBotTyping(false); // re-enable input
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-5 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-2xl shadow-xl">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 p-4 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm space-y-4">
        {messages.filter(m => m.role !== "system").map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-2xl shadow-md max-w-[75%] transition-all duration-300 animate-fadeIn ${msg.role === "user" ? "bg-gradient-to-r from-[#f04e37] to-[#f04e37] text-white rounded-br-none" : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-900 rounded-bl-none"}`} style={{ whiteSpace: "pre-wrap" }}>
              {msg.content === "__loading__" ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-150" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-300" />
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-2 shadow-md">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          disabled={isBotTyping}
          className="flex-grow bg-transparent outline-none px-2 py-1 text-sm sm:text-base"
          placeholder={isBotTyping ? "Juan is typing..." : "Type your message..."}
        />
        <button onClick={handleSend} disabled={isBotTyping} className="bg-transparent">
          <div className="transform rotate-45">
            <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" style={{ color: "#f04e37" }} />
          </div>
        </button>
      </div>
    </div>
  );
}
