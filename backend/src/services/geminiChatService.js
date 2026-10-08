/**
 * Gemini Chat Service for HumanLink / FarmerTrade
 * Integrates Google Gemini Generative Language API
 */
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Ordered fallback list of supported Gemini models
const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest"
];

const SYSTEM_INSTRUCTION = `
You are FarmerDesk (AgriTrade AI), the dedicated agricultural advisor and smart copilot for the HumanLink (FarmerTrade) platform.

ABOUT HUMANLINK / FARMERTRADE:
HumanLink connects agricultural farmers directly with verified commodity buyers (wholesalers, processors, retailers, exporters) across India to ensure fair pricing, zero middleman exploitation, and fast transactions.

PLATFORM CAPABILITIES:
1. Farmer Dashboard:
   - "My Crops" & "Add Crop": List crops with variety, quantity (kg/quintals), expected base price, harvest date, quality grade (Grade A/B/C), organic certification status, and location.
   - "Market Prices": Real-time mandi rates, historical trends, and government MSP benchmarks.
   - "Offers": View incoming buyer price offers, negotiate, accept, or reject with 1 click.
   - "Transactions / Deals": Track verified orders, generate deal summaries, track payment settlement.
   - "Logistics": Request verified agricultural transport trucks, view vehicle types, freight rates, and driver info.
   - "Storage": Search and book certified cold storage and dry warehouses to protect perishable crops.

2. Buyer Dashboard & Marketplace:
   - "Marketplace": Search, filter, and discover available farm crops by category, location, and grade.
   - "Make Offer": Propose customized quantity and price per quintal/kg to farmers.
   - "Deals & Transactions": Finalize purchases with transparent contract terms.
   - "Logistics & Storage": Coordinate pickup and warehouse storage for purchased commodities.

3. Agricultural Advisory:
   - Crop guidance for Kharif, Rabi, and Zaid seasons.
   - Soil fertility, organic composting, NPK fertilization, drip irrigation.
   - Natural and chemical pest control, fungal treatment, weed management.
   - Harvest moisture testing and storage tips to prevent post-harvest losses.
   - Government agricultural schemes (PM-Kisan, PM Fasal Bima Yojana, e-NAM).

YOUR COMMUNICATION STYLE:
- Warm, respectful, practical, and farmer-friendly.
- When addressed in Hindi (हिंदी) or Hinglish, reply naturally in Hindi/Hinglish. If addressed in English, reply in English. You can also assist in Punjabi, Marathi, Telugu, Tamil, Bengali, or Gujarati.
- Use clean Markdown with bold headers and bullet points for easy scanning on mobile devices.
- Keep answers actionable, direct, and helpful without unnecessary fluff.
`;

/**
 * Normalizes input messages into Gemini contents format
 */
const formatMessagesForGemini = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ role: "user", parts: [{ text: "Hello! What can you help me with on FarmerTrade?" }] }];
  }

  return messages
    .filter(msg => msg && (msg.content || msg.text || (msg.parts && msg.parts.length)))
    .map(msg => {
      let role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      let text = msg.content || msg.text || "";
      if (msg.parts && Array.isArray(msg.parts)) {
        return { role, parts: msg.parts };
      }
      return { role, parts: [{ text: String(text) }] };
    });
};

/**
 * Sends chat request to Google Gemini with automatic model fallback
 */
async function generateGeminiChat({ messages, userContext = {} }) {
  const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const contents = formatMessagesForGemini(messages);

  // Dynamic context injection based on user role and current page
  let contextualSystemPrompt = SYSTEM_INSTRUCTION;
  if (userContext.role) {
    contextualSystemPrompt += `\nCURRENT USER CONTEXT: The user is currently logged in as a "${userContext.role}". Name: ${userContext.name || "User"}. Current platform page: ${userContext.currentPage || "Home"}. Tailor your advice appropriately.`;
  }

  const payload = {
    systemInstruction: {
      parts: [{ text: contextualSystemPrompt }]
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024
    }
  };

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return {
          reply: data.candidates[0].content.parts[0].text,
          modelUsed: model
        };
      }

      const errMsg = data.error?.message || `HTTP ${response.status}`;
      console.warn(`[GeminiService] Model ${model} returned error: ${errMsg}. Trying fallback...`);
      lastError = new Error(errMsg);
    } catch (err) {
      console.warn(`[GeminiService] Model ${model} fetch failure: ${err.message}. Trying fallback...`);
      lastError = err;
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || "Unknown error"}`);
}

module.exports = {
  generateGeminiChat,
  SYSTEM_INSTRUCTION
};
