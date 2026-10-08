import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { formatMarkdown } from "./markdownHelper";
import "./ChatbotWidget.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const STORAGE_KEY = "farmerdesk_chat_history_v1";

const DEFAULT_SUGGESTIONS = [
  { id: "s1", text: "🌾 How do I list my crops with fair pricing?", category: "Market" },
  { id: "s2", text: "📈 What are current mandi price trends for wheat & rice?", category: "Prices" },
  { id: "s3", text: "🚛 How do I book pickup logistics for my crops?", category: "Logistics" },
  { id: "s4", text: "❄️ How do I reserve cold storage space?", category: "Storage" },
  { id: "s5", text: "🌱 Organic remedies for pest control in vegetables", category: "Advisory" },
  { id: "s6", text: "🇮🇳 मुझे हिंदी में फसल सुरक्षा और मंडी भाव बताएं", category: "Hindi" }
];

export default function ChatbotWidget() {
  const location = useLocation();

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  // Messaging State
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load chat history from sessionStorage");
    }
    return [
      {
        id: "msg-welcome",
        role: "model",
        content: `**Namaste! Welcome to HumanLink / FarmerTrade!** 🌾🚜\n\nI am **FarmerDesk**, your personal agricultural copilot and trade assistant.\n\nHow can I assist you today? You can ask about:\n* 🌾 **Listing & Selling Crops** at fair prices\n* 📊 **Mandi Rates & MSP Guidelines** across regions\n* 🚛 **Booking Pickup Logistics & Cold Storage**\n* 🤝 **Buyer Negotiations & Trade Settlements**\n* 🌿 **Crop Health, Fertilizers & Pest Control**\n\n*Feel free to talk in English or हिंदी!*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: "Gemini 3.5 Flash"
      }
    ];
  });

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  // Audio / Speech State
  const [isSpeakingId, setIsSpeakingId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn("Could not save chat history to sessionStorage");
    }
  }, [messages]);

  // Check speech synthesis & recognition support
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        setSpeechSupported(true);
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setRecognitionSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = "en-IN"; // Supports bilingual Indian context

        recog.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputValue((prev) => (prev ? prev + " " + transcript : transcript));
          }
          setIsListening(false);
        };

        recog.onerror = (e) => {
          console.warn("Speech recognition error:", e.error);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, []);

  // Fetch dynamic suggestions based on user role
  useEffect(() => {
    const fetchSuggestions = async () => {
      let role = "guest";
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role) role = user.role;
        }
      } catch (err) {}

      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/suggestions?role=${role}`);
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
          }
        }
      } catch (e) {
        // Use default suggestions if offline
      }
    };

    fetchSuggestions();
  }, [location.pathname]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  // Get current user context
  const getUserContext = () => {
    let role = "guest";
    let name = "Visitor";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        role = user.role || role;
        name = user.name || name;
      }
    } catch (e) {}

    return {
      role,
      name,
      currentPage: location.pathname
    };
  };

  // Direct client fallback to Gemini API if backend is unreachable
  const callDirectGemini = async (conversation) => {
    if (!GEMINI_API_KEY) {
      throw new Error("Unable to connect to assistant service at this moment.");
    }
    const candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.8-flash"];
    const userCtx = getUserContext();

    const formattedContents = conversation.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const systemPrompt = `You are FarmerDesk, the dedicated AI agricultural and trade assistant for HumanLink / FarmerTrade. Connect farmers directly to buyers, advise on crop market prices, MSP, logistics, cold storage, pest management, and offer negotiations. Current user is ${userCtx.role} on page ${userCtx.currentPage}. Reply warmly and concisely in English, Hindi, or Hinglish with structured Markdown.`;

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: formattedContents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
          })
        });

        const data = await res.json();
        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return {
            reply: data.candidates[0].content.parts[0].text,
            model
          };
        }
      } catch (err) {
        console.warn(`Direct model ${model} fallback error:`, err);
      }
    }

    throw new Error("Unable to reach Google Gemini services right now.");
  };

  // Send message
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setShowTooltip(false);

    const userMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    // Stop speaking if currently speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
    }

    try {
      let replyText = "";
      let modelUsed = "Gemini 3.5 Flash";

      // 1. First attempt via secure backend endpoint
      try {
        const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content
            })),
            userContext: getUserContext()
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.reply) {
            replyText = data.reply;
            modelUsed = data.model || modelUsed;
          }
        }
      } catch (backendErr) {
        console.warn("Backend /api/ai/chat unreachable, falling back to direct Gemini API call...", backendErr);
      }

      // 2. If backend didn't return a reply, use direct client fallback
      if (!replyText) {
        const directResult = await callDirectGemini(newMessages);
        replyText = directResult.reply;
        modelUsed = directResult.model || modelUsed;
      }

      const botMessage = {
        id: "bot-" + Date.now(),
        role: "model",
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: modelUsed
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = {
        id: "err-" + Date.now(),
        role: "model",
        content: `⚠️ **Connection Notice**: I could not retrieve an answer right now (${err.message}). Please check your network or try again in a moment.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: "Error Notice"
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut (Enter to submit, Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Text-To-Speech (TTS)
  const handleSpeak = (msgId, rawText) => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner speech
    const cleanText = rawText
      .replace(/[#*_`>~]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Detect if text contains Hindi characters
    const hasHindi = /[\u0900-\u097F]/.test(cleanText);
    utterance.lang = hasHindi ? "hi-IN" : "en-IN";

    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Voice Input (Speech-to-Text)
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
      }
    }
  };

  // Copy text to clipboard
  const handleCopy = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear Conversation
  const handleClearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeakingId(null);
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([
      {
        id: "msg-welcome-reset",
        role: "model",
        content: `**Conversation reset.** 🌾\n\nHow can I assist you with your crops, market prices, or deals today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: "Gemini 3.5 Flash"
      }
    ]);
  };

  return (
    <div className="chatbot-launcher-container" id="humanlink-chatbot-root">
      {/* 1. FLOATING GREETING TOOLTIP (When Closed) */}
      {!isOpen && showTooltip && (
        <div
          className="chatbot-greeting-tooltip"
          onClick={() => {
            setIsOpen(true);
            setShowTooltip(false);
          }}
          title="Click to open FarmerDesk AI"
        >
          <div className="chatbot-greeting-icon">🌾</div>
          <div className="chatbot-greeting-text">
            <strong>FarmerDesk AI</strong>
            Have questions on crop prices, buyer deals, or storage? Ask me!
          </div>
          <button
            className="chatbot-greeting-close"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            title="Dismiss greeting"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. FLOATING ACTION BUTTON (FAB) */}
      {!isOpen && (
        <button
          className="chatbot-fab-btn"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setShowTooltip(false);
          }}
          aria-label="Open FarmerDesk Agricultural AI Chatbot"
          id="chatbot-open-button"
        >
          <div className="chatbot-fab-icon">🌾</div>
          <span className="chatbot-fab-badge">AI</span>
        </button>
      )}

      {/* 3. CHAT WINDOW / MODAL */}
      {isOpen && (
        <div
          className={`chatbot-window ${isMinimized ? "minimized" : ""} ${isMaximized ? "maximized" : ""}`}
          id="chatbot-dialog-window"
        >
          {/* HEADER */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-avatar">
                🌾
                <span className="chatbot-online-dot" />
              </div>
              <div className="chatbot-header-info">
                <h3 className="chatbot-title">
                  FarmerDesk
                  <span className="chatbot-gemini-tag">Gemini AI</span>
                </h3>
                <p className="chatbot-subtitle">
                  <span>●</span> Online • Agricultural Advisor
                </p>
              </div>
            </div>

            <div className="chatbot-header-actions">
              {/* Clear chat */}
              <button
                className="chatbot-hdr-btn"
                onClick={handleClearChat}
                title="Clear conversation"
                id="chatbot-btn-clear"
              >
                🗑️
              </button>

              {/* Minimize / Expand */}
              <button
                className="chatbot-hdr-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                id="chatbot-btn-minimize"
              >
                {isMinimized ? "▲" : "▼"}
              </button>

              {/* Maximize toggle */}
              {!isMinimized && (
                <button
                  className="chatbot-hdr-btn"
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? "Restore size" : "Maximize window"}
                  id="chatbot-btn-maximize"
                >
                  {isMaximized ? "❐" : "⛶"}
                </button>
              )}

              {/* Close */}
              <button
                className="chatbot-hdr-btn"
                onClick={() => {
                  setIsOpen(false);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsSpeakingId(null);
                }}
                title="Close chat"
                id="chatbot-btn-close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* MAIN CONTENT (When not minimized) */}
          {!isMinimized && (
            <>
              {/* BANNER */}
              <div className="chatbot-banner">
                <div className="chatbot-banner-left">
                  <span className="chatbot-banner-badge">FarmerTrade AI</span>
                  <span>Instant Mandi Prices, Advisory & Logistics</span>
                </div>
                <div className="chatbot-banner-lang">English & हिंदी</div>
              </div>

              {/* MESSAGES CONTAINER */}
              <div className="chatbot-messages-container" id="chatbot-messages-box">
                {/* Welcome Card */}
                {messages.length <= 1 && (
                  <div className="chatbot-welcome-card">
                    <h4>🌾 HumanLink Smart Copilot</h4>
                    <p>
                      Get direct insights into commodity rates, listing your harvest, connecting with verified buyers,
                      and booking certified cold storage.
                    </p>
                    <div className="chatbot-welcome-features">
                      <div className="chatbot-welcome-feat-item">📊 Mandi Rate Trends</div>
                      <div className="chatbot-welcome-feat-item">🌾 Crop Listing Tips</div>
                      <div className="chatbot-welcome-feat-item">🚛 Logistics Dispatch</div>
                      <div className="chatbot-welcome-feat-item">❄️ Cold Storage Space</div>
                    </div>
                  </div>
                )}

                {/* Message Rows */}
                {messages.map((msg) => (
                  <div key={msg.id} className={`chatbot-message-row ${msg.role}`}>
                    {msg.role === "model" && (
                      <div className="chatbot-msg-avatar" title="FarmerDesk">
                        🌾
                      </div>
                    )}

                    <div className="chatbot-msg-bubble">
                      {msg.role === "model" ? (
                        formatMarkdown(msg.content)
                      ) : (
                        <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                      )}

                      <div className="chatbot-msg-time">{msg.timestamp}</div>

                      {/* Bot Message Action Buttons */}
                      {msg.role === "model" && msg.id !== "msg-welcome" && (
                        <div className="chatbot-msg-actions">
                          <button
                            className="chatbot-msg-action-btn"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            title="Copy reply"
                          >
                            {copiedId === msg.id ? "✓ Copied" : "📋 Copy"}
                          </button>

                          {speechSupported && (
                            <button
                              className="chatbot-msg-action-btn"
                              onClick={() => handleSpeak(msg.id, msg.content)}
                              title={isSpeakingId === msg.id ? "Stop voice" : "Read aloud"}
                            >
                              {isSpeakingId === msg.id ? "⏹ Stop" : "🔊 Listen"}
                            </button>
                          )}

                          {msg.model && <span className="chatbot-msg-model-tag">{msg.model}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="chatbot-typing-row">
                    <div className="chatbot-msg-avatar">🌾</div>
                    <div className="chatbot-typing-bubble">
                      <div className="chatbot-typing-dots">
                        <div className="chatbot-typing-dot" />
                        <div className="chatbot-typing-dot" />
                        <div className="chatbot-typing-dot" />
                      </div>
                      <span className="chatbot-typing-label">FarmerDesk is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK SUGGESTION CHIPS */}
              {suggestions.length > 0 && !isLoading && (
                <div className="chatbot-suggestions-section" style={{ padding: "0 14px 6px 14px" }}>
                  <div className="chatbot-suggestions-label">Suggested Questions</div>
                  <div className="chatbot-suggestions-chips">
                    {suggestions.slice(0, 4).map((sug) => (
                      <button
                        key={sug.id}
                        className="chatbot-chip"
                        onClick={() => handleSendMessage(sug.text)}
                        title={sug.text}
                      >
                        {sug.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* INPUT BAR */}
              <div className="chatbot-input-container">
                <div className="chatbot-input-bar">
                  <textarea
                    ref={inputRef}
                    rows="1"
                    className="chatbot-input-field"
                    placeholder="Ask about crops, prices, orders, logistics... (English / हिंदी)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    id="chatbot-text-input"
                  />

                  {/* Speech to text mic button */}
                  {recognitionSupported && (
                    <button
                      className={`chatbot-mic-btn ${isListening ? "listening" : ""}`}
                      onClick={toggleVoiceInput}
                      title={isListening ? "Listening... click to stop" : "Click to speak your question"}
                      id="chatbot-mic-button"
                      type="button"
                    >
                      {isListening ? "🔴" : "🎙️"}
                    </button>
                  )}

                  {/* Send button */}
                  <button
                    className="chatbot-send-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    title="Send message"
                    id="chatbot-send-button"
                    type="button"
                  >
                    ➔
                  </button>
                </div>

                <div className="chatbot-footer-note">
                  AI agricultural advisor powered by Google Gemini • Verify critical transactions
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
