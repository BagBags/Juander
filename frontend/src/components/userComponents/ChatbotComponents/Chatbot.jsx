import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

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

  // Get auth header (adjust token key if needed)
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch bot entries with auth header
  useEffect(() => {
    async function fetchEntries() {
      try {
        const res = await axios.get("/api/admin/bot", {
          headers: getAuthHeader(),
        });
        setBotEntries(res.data);
      } catch (err) {
        console.error("Error fetching bot entries:", err);
      }
    }
    fetchEntries();
  }, []);

  // Simple language detector
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
      "sino'ng",
      "sino ang",
      "sino si",
      "sino sa",
      "sino yung",
    ];

    const words = text.toLowerCase().split(/\W+/);

    // Bonus: check if text starts with a Filipino question word
    const startsWithFilipinoQuestion = [
      "sino",
      "ano",
      "paano",
      "saan",
      "bakit",
      "kailan",
    ].some((q) => text.toLowerCase().startsWith(q));

    let filipinoCount = 0;
    let englishCount = 0;

    words.forEach((word) => {
      if (filipinoWords.includes(word)) {
        filipinoCount++;
      } else if (word.match(/^[a-z]+$/)) {
        englishCount++;
      }
    });

    // If starts with Filipino question, force Filipino
    if (startsWithFilipinoQuestion) return "filipino";

    return filipinoCount >= englishCount ? "filipino" : "english";
  }

  // Build knowledge text from entries
  function buildKnowledgeText(entries) {
    return entries
      .map(
        (e, i) =>
          `${i + 1}.\nInfo (EN): ${e.info_en}\nInfo (FIL): ${
            e.info_fil || "N/A"
          }\nKeywords: ${e.keywords.join(", ")}`
      )
      .join("\n\n");
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    const lang = detectLanguage(userMessage);

    const SYSTEM_PROMPT =
      lang === "filipino"
        ? `You are a bilingual tour guide chatbot for Intramuros, fluent in English and Filipino.
Use ONLY the provided information to answer user questions.
If you don't know the answer, politely say so.
Answer in Filipino.`
        : `You are a bilingual tour guide chatbot for Intramuros, fluent in English and Filipino.
Use ONLY the provided information to answer user questions.
If you don't know the answer, politely say so.
Answer in English.`;

    const keywords = userMessage.toLowerCase().split(/\W+/).filter(Boolean);
    const relevantEntries = botEntries.filter((entry) =>
      keywords.some(
        (kw) =>
          entry.keywords.some((k) => k.toLowerCase().includes(kw)) ||
          entry.info_en.toLowerCase().includes(kw) ||
          (entry.info_fil && entry.info_fil.toLowerCase().includes(kw))
      )
    );

    const entriesToUse = relevantEntries.length ? relevantEntries : botEntries;

    const knowledgeText = buildKnowledgeText(entriesToUse);

    const fullPrompt = `${SYSTEM_PROMPT}\nUse this information:\n${knowledgeText}\nUser: ${userMessage}`;

    if (!window.puter) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Juan is not loaded yet. Please wait a moment.",
        },
      ]);
      return;
    }

    try {
      const response = await window.puter.ai.chat(fullPrompt, {
        model: "gpt-4.1-nano",
        temperature: 0.3,
        max_tokens: 500,
      });

      let reply = "";

      if (typeof response === "string") {
        reply = response;
      } else if (response && typeof response === "object") {
        if (response.message && typeof response.message.content === "string") {
          reply = response.message.content;
        } else {
          reply = JSON.stringify(response);
        }
      } else {
        reply = String(response);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Puter.js API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't get an answer. Please try again.",
        },
      ]);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow bg-white">
      <div className="h-80 overflow-y-auto mb-4 p-2 border rounded bg-gray-50">
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
                {typeof msg.content === "string"
                  ? msg.content
                  : JSON.stringify(msg.content, null, 2)}
              </div>
            </div>
          ))}
      </div>
      <div className="flex space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-grow border rounded px-3 py-2"
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
