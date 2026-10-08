const Offer = require("../models/Offer");
const Crop = require("../models/Crop");
const mongoose = require("mongoose");

// Middleware helper checks
const isBuyer = (req, res, next) => {
    if (req.user.role !== "buyer") {
        return res.status(403).json({ success: false, message: "Only buyers can perform this action" });
    }
    next();
};

const isFarmer = (req, res, next) => {
    if (req.user.role !== "farmer") {
        return res.status(403).json({ success: false, message: "Only farmers can perform this action" });
    }
    next();
};

// ============================
// CREATE OFFER (BUYER)
// ============================
const createOffer = async (req, res) => {
    try {
        const { cropId, quantity, offeredPrice, message } = req.body;

        if (!cropId) return res.status(400).json({ success: false, message: "Crop ID is required" });
        if (!quantity || Number(quantity) <= 0) return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
        if (offeredPrice === undefined || Number(offeredPrice) < 0) return res.status(400).json({ success: false, message: "Offered price cannot be negative" });

        if (!mongoose.Types.ObjectId.isValid(cropId)) {
            return res.status(404).json({ success: false, message: "Crop not found" });
        }

        const crop = await Crop.findById(cropId);
        if (!crop) {
            return res.status(404).json({ success: false, message: "Crop not found" });
        }

        if (crop.status !== "available") {
            return res.status(400).json({ success: false, message: "This crop is not available for offers" });
        }

        if (Number(quantity) > crop.quantity) {
            return res.status(400).json({ success: false, message: "Requested quantity exceeds available quantity." });
        }

        // Prevent duplicate pending offers by the same buyer for the same crop
        const existingPendingOffer = await Offer.findOne({
            buyer: req.user.userId,
            crop: cropId,
            status: "pending"
        });

        if (existingPendingOffer) {
            return res.status(400).json({ success: false, message: "You already have a pending offer for this crop." });
        }

        const newOffer = await Offer.create({
            buyer: req.user.userId,
            farmer: crop.farmer,
            crop: crop._id,
            quantity: Number(quantity),
            offeredPrice: Number(offeredPrice),
            message: message ? message.trim() : "",
            status: "pending"
        });

        const populatedOffer = await Offer.findById(newOffer._id)
            .populate("crop")
            .populate("farmer", "name location phone");

        res.status(201).json({
            success: true,
            message: "Offer submitted successfully",
            offer: populatedOffer
        });
    } catch (error) {
        console.error("Create offer error:", error);
        res.status(500).json({ success: false, message: "Server error creating offer" });
    }
};

// ============================
// GET MY SENT OFFERS (BUYER)
// ============================
const getMyOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ buyer: req.user.userId })
            .populate("crop")
            .populate("farmer", "name location phone")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: offers.length,
            offers
        });
    } catch (error) {
        console.error("Get my offers error:", error);
        res.status(500).json({ success: false, message: "Server error fetching offers" });
    }
};

// ============================
// GET RECEIVED OFFERS (FARMER)
// ============================
const getReceivedOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ farmer: req.user.userId })
            .populate("crop")
            .populate("buyer", "name email phone businessName businessType")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: offers.length,
            offers
        });
    } catch (error) {
        console.error("Get received offers error:", error);
        res.status(500).json({ success: false, message: "Server error fetching received offers" });
    }
};

// ============================
// GET SINGLE OFFER BY ID
// ============================
const getOfferById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        const offer = await Offer.findById(id)
            .populate("crop")
            .populate("buyer", "name email phone businessName businessType")
            .populate("farmer", "name location phone");

        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        // Ownership security check: User must be buyer or farmer of this offer
        const isBuyerOfOffer = offer.buyer._id.toString() === req.user.userId;
        const isFarmerOfOffer = offer.farmer._id.toString() === req.user.userId;

        if (!isBuyerOfOffer && !isFarmerOfOffer) {
            return res.status(403).json({ success: false, message: "You are not authorized to view this offer" });
        }

        res.status(200).json({
            success: true,
            offer
        });
    } catch (error) {
        console.error("Get offer by id error:", error);
        res.status(500).json({ success: false, message: "Server error fetching offer details" });
    }
};

// ============================
// ACCEPT OFFER (FARMER ONLY)
// ============================
const acceptOffer = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        if (offer.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to accept this offer" });
        }

        if (offer.status !== "pending") {
            return res.status(400).json({ success: false, message: "Offer is already finalized and cannot be changed." });
        }

        offer.status = "accepted";
        await offer.save();

        res.status(200).json({
            success: true,
            message: "Offer accepted successfully",
            offer
        });
    } catch (error) {
        console.error("Accept offer error:", error);
        res.status(500).json({ success: false, message: "Server error accepting offer" });
    }
};

// ============================
// REJECT OFFER (FARMER ONLY)
// ============================
const rejectOffer = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        if (offer.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to reject this offer" });
        }

        if (offer.status !== "pending") {
            return res.status(400).json({ success: false, message: "Offer is already finalized and cannot be changed." });
        }

        offer.status = "rejected";
        await offer.save();

        res.status(200).json({
            success: true,
            message: "Offer rejected successfully",
            offer
        });
    } catch (error) {
        console.error("Reject offer error:", error);
        res.status(500).json({ success: false, message: "Server error rejecting offer" });
    }
};

// ============================
// CANCEL OFFER (BUYER ONLY)
// ============================
const cancelOffer = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        if (offer.buyer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to cancel this offer" });
        }

        if (offer.status !== "pending") {
            return res.status(400).json({ success: false, message: "Offer is already finalized and cannot be changed." });
        }

        offer.status = "cancelled";
        await offer.save();

        res.status(200).json({
            success: true,
            message: "Offer cancelled successfully",
            offer
        });
    } catch (error) {
        console.error("Cancel offer error:", error);
        res.status(500).json({ success: false, message: "Server error cancelling offer" });
    }
};

module.exports = {
    isBuyer,
    isFarmer,
    createOffer,
    getMyOffers,
    getReceivedOffers,
    getOfferById,
    acceptOffer,
    rejectOffer,
    cancelOffer
};
