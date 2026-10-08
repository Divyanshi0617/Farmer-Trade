const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    isBuyer,
    isFarmer,
    createOffer,
    getMyOffers,
    getReceivedOffers,
    getOfferById,
    acceptOffer,
    rejectOffer,
    cancelOffer
} = require("../controllers/offerController");

const router = express.Router();

// All offer routes require authentication
router.use(protect);

// Buyer endpoints
router.post("/", isBuyer, createOffer);
router.get("/my", isBuyer, getMyOffers);
router.patch("/:id/cancel", isBuyer, cancelOffer);

// Farmer endpoints
router.get("/received", isFarmer, getReceivedOffers);
router.patch("/:id/accept", isFarmer, acceptOffer);
router.patch("/:id/reject", isFarmer, rejectOffer);

// Shared/ownership protected endpoint
router.get("/:id", getOfferById);

module.exports = router;
