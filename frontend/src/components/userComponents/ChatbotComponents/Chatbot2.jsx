import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Filter } from "bad-words"; // Named import
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
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Welcome! Ask me anything about Intramuros in English or Filipino.",
    },
  ]);
  const [input, setInput] = useState("");
  const sessionId = useRef(uuidv4());
  const [botEntries, setBotEntries] = useState([]);

  // --- Load Knowledge Base ---
  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/bot`);
        setBotEntries(res.data);
      } catch (err) {
        console.error("Error fetching bot entries:", err);
      }
    }
    fetchEntries();
  }, []);

  // --- Language Detector ---
  function detectLanguage(text) {
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

    words.forEach((word) => {
      if (filipinoWords.includes(word)) filipinoCount++;
      else if (word.match(/^[a-z]+$/)) englishCount++;
    });

    if (startsWithFilipino) return "filipino";
    return filipinoCount >= englishCount ? "filipino" : "english";
  }

  // --- Knowledge Builder ---
  function buildKnowledgeText(entries) {
    return entries
      .map(
        (e, i) =>
          `${i + 1}.\nEN: ${e.info_en}\nFIL: ${
            e.info_fil || "N/A"
          }\nKeywords: ${e.keywords.join(", ")}`
      )
      .join("\n\n");
  }

  // --- Handle Send ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    // --- Profanity Check ---
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
      return; // Stop processing further
    }

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    const lang = detectLanguage(userMessage);

    const SYSTEM_PROMPT =
      lang === "filipino"
        ? `You are Juan, a Filipino tour guide chatbot for Intramuros.
Answer ONLY from the knowledge base.
If the answer is not there, reply exactly:
"Pasensya na, wala akong impormasyon tungkol diyan sa aking knowledge base."
Always answer in Filipino.`
        : `You are Juan, an English-speaking tour guide chatbot for Intramuros.
Answer ONLY from the knowledge base.
If the answer is not there, reply exactly:
"Sorry, I don’t have information about that in my knowledge base."
Always answer in English.`;

    const keywords = userMessage.toLowerCase().split(/\W+/).filter(Boolean);

    const relevantEntries = botEntries.filter(
      (entry) =>
        keywords.some((kw) =>
          entry.keywords.some((k) => k.toLowerCase().includes(kw))
        ) ||
        entry.info_en.toLowerCase().includes(userMessage.toLowerCase()) ||
        (entry.info_fil &&
          entry.info_fil.toLowerCase().includes(userMessage.toLowerCase()))
    );

    if (relevantEntries.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            lang === "filipino"
              ? "Pasensya na, wala akong impormasyon tungkol diyan sa aking knowledge base."
              : "Sorry, I don’t have information about that in my knowledge base.",
        },
      ]);
      return;
    }

    const knowledgeText = buildKnowledgeText(relevantEntries);
    const fullPrompt = `${SYSTEM_PROMPT}\n\nKnowledge Base:\n${knowledgeText}\n\nUser: ${userMessage}`;

    if (!window.puter) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Juan is still waking up. Please try again shortly.",
        },
      ]);
      return;
    }

    try {
      const response = await window.puter.ai.chat(fullPrompt, {
        model: "gpt-4.1-nano",
        temperature: 0,
        max_tokens: 500,
      });

      let reply =
        typeof response === "string"
          ? response
          : response?.message?.content || JSON.stringify(response);

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Puter.js API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Oops! Juan ran into a problem answering. Please try again later.",
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-3 sm:p-4 bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-3 p-2 border rounded bg-gray-50">
        {messages
          .filter((m) => m.role !== "system")
          .map((msg, i) => (
            <div
              key={i}
              className={`mb-2 ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block px-3 py-2 rounded ${
                  msg.role === "user"
                    ? "bg-[#f04e37] text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {msg.content}
              </div>
            </div>
          ))}
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-grow border rounded px-3 py-2 text-sm sm:text-base"
          placeholder="Type your question here..."
        />
        <button
          onClick={handleSend}
          className="bg-[#f04e37] text-white px-4 py-2 rounded hover:bg-[#d03b27]"
        >
          Send
        </button>
      </div>
    </div>
  );
}
