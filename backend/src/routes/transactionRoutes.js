const express = require("express");
const protect = require("../middleware/authMiddleware");
const { isFarmer } = require("../controllers/cropController");
const {
    createTransactionFromOffer,
    updateTransactionCosts,
    updateTransactionStatus,
    getMyTransactions,
    getTransactionById
} = require("../controllers/transactionController");

const router = express.Router();

// All transaction routes require authentication
router.use(protect);

// Farmer endpoints
router.post("/from-offer/:offerId", isFarmer, createTransactionFromOffer);
router.patch("/:id/costs", isFarmer, updateTransactionCosts);

// Shared/Role-based endpoints
router.get("/my", getMyTransactions);
router.patch("/:id/status", updateTransactionStatus);
router.get("/:id", getTransactionById);

module.exports = router;
