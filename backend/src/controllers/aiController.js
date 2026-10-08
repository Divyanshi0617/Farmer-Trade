const { generateGeminiChat } = require("../services/geminiChatService");

/**
 * Handle AI Chat queries
 * POST /api/ai/chat
 */
const chat = async (req, res) => {
  try {
    const { messages, message, userContext } = req.body;

    let conversation = messages;
    if (!conversation && message) {
      conversation = [{ role: "user", content: message }];
    }

    if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A prompt or conversation messages array is required."
      });
    }

    const result = await generateGeminiChat({
      messages: conversation,
      userContext: userContext || {}
    });

    return res.status(200).json({
      success: true,
      reply: result.reply,
      model: result.modelUsed
    });
  } catch (error) {
    console.error("AI Chat Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI response."
    });
  }
};

/**
 * Get context-sensitive prompt suggestions
 * GET /api/ai/suggestions
 */
const getSuggestions = (req, res) => {
  const role = req.query.role || "guest";

  const suggestions = {
    farmer: [
      { id: "f1", text: "🌾 How do I list my crops with fair pricing?", category: "Market" },
      { id: "f2", text: "📈 What are current mandi price trends for wheat & rice?", category: "Prices" },
      { id: "f3", text: "🚛 How do I book pickup logistics for my harvested crop?", category: "Logistics" },
      { id: "f4", text: "❄️ How do I reserve cold storage space?", category: "Storage" },
      { id: "f5", text: "🌱 Best natural remedies for pest control in tomatoes", category: "Advisory" },
      { id: "f6", text: "🇮🇳 मुझे हिंदी में फसल सुरक्षा और मंडी भाव बताएं", category: "Hindi" }
    ],
    buyer: [
      { id: "b1", text: "🛒 How do I search and filter crops in the marketplace?", category: "Browse" },
      { id: "b2", text: "🤝 How do I submit an offer and negotiate with farmers?", category: "Deals" },
      { id: "b3", text: "🚛 How can I arrange transportation for purchased crops?", category: "Logistics" },
      { id: "b4", text: "🏷️ What quality parameters should I inspect (Grade A vs B)?", category: "Quality" },
      { id: "b5", text: "📊 How are government MSP prices compared with spot rates?", category: "Analytics" }
    ],
    guest: [
      { id: "g1", text: "🌾 What is HumanLink FarmerTrade and how does it work?", category: "About" },
      { id: "g2", text: "👨‍🌾 How can a farmer register and sell crops directly?", category: "Farmers" },
      { id: "g3", text: "🏢 How can wholesale buyers source produce directly?", category: "Buyers" },
      { id: "g4", text: "💡 Why choose direct farmer-to-buyer trade over middlemen?", category: "Benefits" },
      { id: "g5", text: "🇮🇳 क्या आप हिंदी में सहायता कर सकते हैं?", category: "Hindi" }
    ]
  };

  return res.status(200).json({
    success: true,
    suggestions: suggestions[role] || suggestions.guest
  });
};

module.exports = {
  chat,
  getSuggestions
};
