const express = require("express");
const {
    getMarketplaceCrops,
    getMarketplaceCropById
} = require("../controllers/marketplaceController");

const router = express.Router();

// Public/Authenticated GET routes for buyer crop discovery
router.get("/crops", getMarketplaceCrops);
router.get("/crops/:id", getMarketplaceCropById);

module.exports = router;
