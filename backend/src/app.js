const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const cropRoutes = require("./routes/cropRoutes");

const app = express();


// ============================
// MIDDLEWARE
// ============================

app.use(cors());

app.use(express.json());


// ============================
// BASIC ROUTE
// ============================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HumanLink API is running",
        status: "OK"
    });
});


// ============================
// HEALTH CHECK
// ============================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HumanLink backend is healthy"
    });
});


// ============================
// AUTH ROUTES
// ============================

app.use("/api/auth", authRoutes);

// ============================
// CROP ROUTES
// ============================

app.use("/api/crops", cropRoutes);

// ============================
// MARKET PRICE ROUTES
// ============================

const marketPriceRoutes = require("./routes/marketPriceRoutes");
app.use("/api/market-prices", marketPriceRoutes);

// ============================
// MARKETPLACE, OFFER & TRANSACTION ROUTES
// ============================

const marketplaceRoutes = require("./routes/marketplaceRoutes");
const offerRoutes = require("./routes/offerRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/transactions", transactionRoutes);

// ============================
// LOGISTICS & STORAGE ROUTES
// ============================

const logisticsRoutes = require("./routes/logisticsRoutes");
const storageRoutes = require("./routes/storageRoutes");

app.use("/api/logistics", logisticsRoutes);
app.use("/api/storage", storageRoutes);

// ============================
// AI & CHATBOT ROUTES (Gemini)
// ============================

const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);

// ============================
// REAL-TIME CHAT & MESSAGING ROUTES
// ============================

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/chat", chatRoutes);



// ============================
// 404 HANDLER
// ============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});


module.exports = app;