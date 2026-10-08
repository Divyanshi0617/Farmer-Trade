const express = require("express");
const { chat, getSuggestions } = require("../controllers/aiController");

const router = express.Router();

// Chatbot query endpoint
router.post("/chat", chat);

// Contextual suggested prompts
router.get("/suggestions", getSuggestions);

module.exports = router;
