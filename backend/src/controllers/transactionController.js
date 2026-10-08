const Transaction = require("../models/Transaction");
const Offer = require("../models/Offer");
const Crop = require("../models/Crop");
const mongoose = require("mongoose");

// ============================
// CREATE TRANSACTION FROM ACCEPTED OFFER (FARMER ONLY)
// ============================
const createTransactionFromOffer = async (req, res) => {
    try {
        const { offerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(offerId)) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        // 1. Fetch Offer
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        // 2. Offer must be accepted
        if (offer.status !== "accepted") {
            return res.status(400).json({ success: false, message: "Transaction can only be created from an accepted offer." });
        }

        // 3. Authenticated user must be the farmer of the offer
        if (offer.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to create a transaction for this offer." });
        }

        // 4. Prevent duplicate transaction creation for the same offer
        const existingTransaction = await Transaction.findOne({ offer: offerId });
        if (existingTransaction) {
            return res.status(400).json({
                success: false,
                message: "A transaction has already been created for this offer.",
                transactionId: existingTransaction._id
            });
        }

        // 5. Fetch associated Crop
        const crop = await Crop.findById(offer.crop);
        if (!crop) {
            return res.status(404).json({ success: false, message: "Associated crop not found" });
        }

        // 6. Verify crop ownership
        if (crop.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to operate on this crop." });
        }

        // 7. Check crop status & available quantity
        if (crop.status !== "available") {
            return res.status(400).json({ success: false, message: "Associated crop is no longer available." });
        }

        if (offer.quantity > crop.quantity) {
            return res.status(400).json({ success: false, message: "Offer quantity exceeds current available crop quantity." });
        }

        // 8. Server-side Calculations
        const agreedPrice = offer.offeredPrice;
        const quantity = offer.quantity;
        const grossAmount = agreedPrice * quantity;

        const transportCost = 0;
        const loadingCost = 0;
        const storageCost = 0;
        const otherCosts = 0;
        const totalCosts = 0;
        const netRealisation = grossAmount;

        // 9. Update Crop Quantity & Status
        const remainingQuantity = crop.quantity - quantity;
        crop.quantity = remainingQuantity;
        if (remainingQuantity <= 0) {
            crop.quantity = 0;
            crop.status = "sold";
        }
        await crop.save();

        // 10. Create Transaction
        const newTransaction = await Transaction.create({
            buyer: offer.buyer,
            farmer: offer.farmer,
            crop: offer.crop,
            offer: offer._id,
            quantity,
            agreedPrice,
            grossAmount,
            transportCost,
            loadingCost,
            storageCost,
            otherCosts,
            totalCosts,
            netRealisation,
            status: "initiated"
        });

        const populatedTransaction = await Transaction.findById(newTransaction._id)
            .populate("buyer", "name email phone businessName businessType")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit expectedPrice state district")
            .populate("offer");

        res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction: populatedTransaction
        });

    } catch (error) {
        console.error("Create transaction error:", error);
        res.status(500).json({ success: false, message: "Server error creating transaction" });
    }
};

// ============================
// UPDATE TRANSACTION COSTS (FARMER ONLY)
// ============================
const updateTransactionCosts = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        // Only farmer who owns the transaction can update costs
        if (transaction.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to update costs for this transaction" });
        }

        const { transportCost, loadingCost, storageCost, otherCosts } = req.body;

        // Validate cost inputs
        if (transportCost !== undefined && (isNaN(Number(transportCost)) || Number(transportCost) < 0)) {
            return res.status(400).json({ success: false, message: "Transport cost must be a number greater than or equal to 0" });
        }
        if (loadingCost !== undefined && (isNaN(Number(loadingCost)) || Number(loadingCost) < 0)) {
            return res.status(400).json({ success: false, message: "Loading cost must be a number greater than or equal to 0" });
        }
        if (storageCost !== undefined && (isNaN(Number(storageCost)) || Number(storageCost) < 0)) {
            return res.status(400).json({ success: false, message: "Storage cost must be a number greater than or equal to 0" });
        }
        if (otherCosts !== undefined && (isNaN(Number(otherCosts)) || Number(otherCosts) < 0)) {
            return res.status(400).json({ success: false, message: "Other costs must be a number greater than or equal to 0" });
        }

        if (transportCost !== undefined) transaction.transportCost = Number(transportCost);
        if (loadingCost !== undefined) transaction.loadingCost = Number(loadingCost);
        if (storageCost !== undefined) transaction.storageCost = Number(storageCost);
        if (otherCosts !== undefined) transaction.otherCosts = Number(otherCosts);

        // Recalculate totalCosts & netRealisation on backend
        transaction.totalCosts = transaction.transportCost + transaction.loadingCost + transaction.storageCost + transaction.otherCosts;
        transaction.netRealisation = transaction.grossAmount - transaction.totalCosts;

        await transaction.save();

        const populatedTransaction = await Transaction.findById(transaction._id)
            .populate("buyer", "name email phone businessName businessType")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit expectedPrice state district")
            .populate("offer");

        res.status(200).json({
            success: true,
            message: "Costs updated successfully",
            transaction: populatedTransaction
        });

    } catch (error) {
        console.error("Update transaction costs error:", error);
        res.status(500).json({ success: false, message: "Server error updating costs" });
    }
};

// ============================
// UPDATE TRANSACTION STATUS
// ============================
const updateTransactionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        if (!status || !["initiated", "confirmed", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid transaction status value" });
        }

        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        const isFarmer = transaction.farmer.toString() === req.user.userId;
        const isBuyer = transaction.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to update status for this transaction" });
        }

        const currentStatus = transaction.status;

        // Finalized states cannot be changed
        if (currentStatus === "completed" || currentStatus === "cancelled") {
            return res.status(400).json({ success: false, message: "Transaction is already finalized and status cannot be changed." });
        }

        // Controlled transition rules
        if (currentStatus === "initiated") {
            if (!["confirmed", "cancelled"].includes(status)) {
                return res.status(400).json({ success: false, message: `Cannot transition from '${currentStatus}' to '${status}'.` });
            }
        } else if (currentStatus === "confirmed") {
            if (!["completed", "cancelled"].includes(status)) {
                return res.status(400).json({ success: false, message: `Cannot transition from '${currentStatus}' to '${status}'.` });
            }
        }

        transaction.status = status;
        await transaction.save();

        const populatedTransaction = await Transaction.findById(transaction._id)
            .populate("buyer", "name email phone businessName businessType")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit expectedPrice state district")
            .populate("offer");

        res.status(200).json({
            success: true,
            message: `Transaction status updated to ${status}`,
            transaction: populatedTransaction
        });

    } catch (error) {
        console.error("Update transaction status error:", error);
        res.status(500).json({ success: false, message: "Server error updating status" });
    }
};

// ============================
// GET MY TRANSACTIONS (ROLE-BASED)
// ============================
const getMyTransactions = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "farmer") {
            filter.farmer = req.user.userId;
        } else if (req.user.role === "buyer") {
            filter.buyer = req.user.userId;
        } else {
            return res.status(403).json({ success: false, message: "Unauthorized role" });
        }

        const transactions = await Transaction.find(filter)
            .populate("buyer", "name email phone businessName businessType")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit expectedPrice state district")
            .populate("offer")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: transactions.length,
            transactions
        });
    } catch (error) {
        console.error("Get my transactions error:", error);
        res.status(500).json({ success: false, message: "Server error fetching transactions" });
    }
};

// ============================
// GET SINGLE TRANSACTION BY ID
// ============================
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        const transaction = await Transaction.findById(id)
            .populate("buyer", "name email phone businessName businessType")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit expectedPrice state district harvestDate description")
            .populate("offer");

        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        // Ownership authorization check
        const isFarmer = transaction.farmer._id.toString() === req.user.userId;
        const isBuyer = transaction.buyer._id.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to view this transaction" });
        }

        res.status(200).json({
            success: true,
            transaction
        });
    } catch (error) {
        console.error("Get transaction by id error:", error);
        res.status(500).json({ success: false, message: "Server error fetching transaction details" });
    }
};

module.exports = {
    createTransactionFromOffer,
    updateTransactionCosts,
    updateTransactionStatus,
    getMyTransactions,
    getTransactionById
};
