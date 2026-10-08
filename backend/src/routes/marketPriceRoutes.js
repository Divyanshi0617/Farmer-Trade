const express = require("express");
const {
    getMarketPrices,
    getMarketPriceById,
    getPriceHistory,
    syncGovernmentPrices
} = require("../controllers/marketPriceController");

const router = express.Router();

// Public GET routes for market prices
router.get("/", getMarketPrices);
router.get("/history/:cropName", getPriceHistory);
router.get("/:id", getMarketPriceById);

// Admin / Manual Sync route for Government Market Prices
router.post("/sync-government", syncGovernmentPrices);

module.exports = router;

