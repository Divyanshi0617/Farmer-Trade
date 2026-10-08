const Storage = require("../models/Storage");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// Helper to calculate total active storage costs for a transaction and sync to Transaction model
const syncTransactionStorageCost = async (transactionId) => {
    const transaction = await Transaction.findById(transactionId);
    if (transaction) {
        const activeStorageRecords = await Storage.find({
            transaction: transactionId,
            status: { $ne: "cancelled" }
        });

        const totalStorageCost = activeStorageRecords.reduce((sum, item) => sum + (item.storageCost || 0), 0);

        transaction.storageCost = totalStorageCost;
        transaction.totalCosts = transaction.transportCost + transaction.loadingCost + transaction.storageCost + transaction.otherCosts;
        transaction.netRealisation = transaction.grossAmount - transaction.totalCosts;
        await transaction.save();
    }
    return transaction;
};

// ============================
// CREATE STORAGE FROM TRANSACTION
// ============================
const createStorageFromTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        // Authorization check: User must be farmer or buyer of the transaction
        const isFarmer = transaction.farmer.toString() === req.user.userId;
        const isBuyer = transaction.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to create storage for this transaction" });
        }

        const {
            storageName,
            storageLocation,
            storageType,
            quantity,
            entryDate,
            expectedExitDate,
            storageCost,
            notes
        } = req.body;

        if (!storageName || !storageName.trim()) {
            return res.status(400).json({ success: false, message: "Storage name is required" });
        }

        if (!storageLocation || !storageLocation.trim()) {
            return res.status(400).json({ success: false, message: "Storage location is required" });
        }

        const numericQty = Number(quantity);
        if (isNaN(numericQty) || numericQty <= 0) {
            return res.status(400).json({ success: false, message: "Storage quantity must be greater than 0" });
        }

        if (numericQty > transaction.quantity) {
            return res.status(400).json({
                success: false,
                message: `Storage quantity (${numericQty}) cannot exceed transaction quantity (${transaction.quantity}).`
            });
        }

        const numericCost = storageCost !== undefined ? Number(storageCost) : 0;
        if (isNaN(numericCost) || numericCost < 0) {
            return res.status(400).json({ success: false, message: "Storage cost must be a number greater than or equal to 0" });
        }

        const newStorage = await Storage.create({
            transaction: transaction._id,
            farmer: transaction.farmer,
            crop: transaction.crop,
            storageName: storageName.trim(),
            storageLocation: storageLocation.trim(),
            storageType: storageType || "warehouse",
            quantity: numericQty,
            entryDate: entryDate || Date.now(),
            expectedExitDate: expectedExitDate || null,
            storageCost: numericCost,
            status: "stored",
            notes: notes ? notes.trim() : ""
        });

        // Sync cost to transaction
        await syncTransactionStorageCost(transaction._id);

        const populatedStorage = await Storage.findById(newStorage._id)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit");

        res.status(201).json({
            success: true,
            message: "Storage record created successfully",
            storage: populatedStorage
        });

    } catch (error) {
        console.error("Create storage error:", error);
        res.status(500).json({ success: false, message: "Server error creating storage record" });
    }
};

// ============================
// GET MY STORAGE RECORDS
// ============================
const getMyStorage = async (req, res) => {
    try {
        let storageList = [];

        if (req.user.role === "farmer") {
            storageList = await Storage.find({ farmer: req.user.userId })
                .populate("transaction")
                .populate("farmer", "name email phone location")
                .populate("crop", "cropName cropType quantity unit")
                .sort({ createdAt: -1 });
        } else if (req.user.role === "buyer") {
            // Find transactions for this buyer
            const buyerTransactions = await Transaction.find({ buyer: req.user.userId }).select("_id");
            const transactionIds = buyerTransactions.map(t => t._id);

            storageList = await Storage.find({ transaction: { $in: transactionIds } })
                .populate("transaction")
                .populate("farmer", "name email phone location")
                .populate("crop", "cropName cropType quantity unit")
                .sort({ createdAt: -1 });
        } else {
            return res.status(403).json({ success: false, message: "Unauthorized role" });
        }

        res.status(200).json({
            success: true,
            count: storageList.length,
            storage: storageList
        });

    } catch (error) {
        console.error("Get my storage error:", error);
        res.status(500).json({ success: false, message: "Server error fetching storage records" });
    }
};

// ============================
// GET STORAGE BY ID
// ============================
const getStorageById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Storage record not found" });
        }

        const storageRecord = await Storage.findById(id)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit");

        if (!storageRecord) {
            return res.status(404).json({ success: false, message: "Storage record not found" });
        }

        const transaction = await Transaction.findById(storageRecord.transaction._id || storageRecord.transaction);
        const isFarmer = storageRecord.farmer._id.toString() === req.user.userId;
        const isBuyer = transaction && transaction.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to view this storage record" });
        }

        res.status(200).json({
            success: true,
            storage: storageRecord
        });

    } catch (error) {
        console.error("Get storage by id error:", error);
        res.status(500).json({ success: false, message: "Server error fetching storage details" });
    }
};

// ============================
// UPDATE STORAGE
// ============================
const updateStorage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Storage record not found" });
        }

        const storageRecord = await Storage.findById(id);
        if (!storageRecord) {
            return res.status(404).json({ success: false, message: "Storage record not found" });
        }

        const transaction = await Transaction.findById(storageRecord.transaction);
        const isFarmer = storageRecord.farmer.toString() === req.user.userId;
        const isBuyer = transaction && transaction.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this storage record" });
        }

        const {
            storageName,
            storageLocation,
            storageType,
            quantity,
            entryDate,
            expectedExitDate,
            actualExitDate,
            storageCost,
            notes
        } = req.body;

        if (storageName !== undefined) {
            if (!storageName || !storageName.trim()) {
                return res.status(400).json({ success: false, message: "Storage name cannot be empty" });
            }
            storageRecord.storageName = storageName.trim();
        }

        if (storageLocation !== undefined) {
            if (!storageLocation || !storageLocation.trim()) {
                return res.status(400).json({ success: false, message: "Storage location cannot be empty" });
            }
            storageRecord.storageLocation = storageLocation.trim();
        }

        if (quantity !== undefined) {
            const numericQty = Number(quantity);
            if (isNaN(numericQty) || numericQty <= 0) {
                return res.status(400).json({ success: false, message: "Storage quantity must be greater than 0" });
            }
            if (transaction && numericQty > transaction.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Storage quantity (${numericQty}) cannot exceed transaction quantity (${transaction.quantity}).`
                });
            }
            storageRecord.quantity = numericQty;
        }

        if (storageType !== undefined) storageRecord.storageType = storageType;
        if (entryDate !== undefined) storageRecord.entryDate = entryDate;
        if (expectedExitDate !== undefined) storageRecord.expectedExitDate = expectedExitDate;
        if (actualExitDate !== undefined) storageRecord.actualExitDate = actualExitDate;
        if (notes !== undefined) storageRecord.notes = notes.trim();

        if (storageCost !== undefined) {
            const numericCost = Number(storageCost);
            if (isNaN(numericCost) || numericCost < 0) {
                return res.status(400).json({ success: false, message: "Storage cost must be a number greater than or equal to 0" });
            }
            storageRecord.storageCost = numericCost;
        }

        await storageRecord.save();

        // Recalculate transaction storage cost
        await syncTransactionStorageCost(storageRecord.transaction);

        const populatedStorage = await Storage.findById(storageRecord._id)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit");

        res.status(200).json({
            success: true,
            message: "Storage record updated successfully",
            storage: populatedStorage
        });

    } catch (error) {
        console.error("Update storage error:", error);
        res.status(500).json({ success: false, message: "Server error updating storage record" });
    }
};

// ============================
// UPDATE STORAGE STATUS
// ============================
const updateStorageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Storage record not found" });
        }

        const validStatuses = ["stored", "partially_released", "released", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid storage status value" });
        }

        const storageRecord = await Storage.findById(id);
        if (!storageRecord) {
            return res.status(404).json({ success: false, message: "Storage record not found" });
        }

        const transaction = await Transaction.findById(storageRecord.transaction);
        const isFarmer = storageRecord.farmer.toString() === req.user.userId;
        const isBuyer = transaction && transaction.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to update status for this storage record" });
        }

        const currentStatus = storageRecord.status;

        // Final states check
        if (currentStatus === "released" || currentStatus === "cancelled") {
            return res.status(400).json({ success: false, message: `Storage is already in '${currentStatus}' status and cannot be changed.` });
        }

        const allowedTransitions = {
            stored: ["partially_released", "released", "cancelled"],
            partially_released: ["released", "cancelled"]
        };

        if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
            return res.status(400).json({ success: false, message: `Cannot transition storage status from '${currentStatus}' to '${status}'.` });
        }

        storageRecord.status = status;
        if ((status === "released" || status === "partially_released") && !storageRecord.actualExitDate) {
            storageRecord.actualExitDate = new Date();
        }

        await storageRecord.save();

        // Sync cost (if cancelled, cost will be excluded from total storage costs)
        await syncTransactionStorageCost(storageRecord.transaction);

        const populatedStorage = await Storage.findById(storageRecord._id)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("crop", "cropName cropType quantity unit");

        res.status(200).json({
            success: true,
            message: `Storage status updated to ${status}`,
            storage: populatedStorage
        });

    } catch (error) {
        console.error("Update storage status error:", error);
        res.status(500).json({ success: false, message: "Server error updating storage status" });
    }
};

// ============================
// DELETE STORAGE
// ============================
const deleteStorage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Storage record not found" });
        }

        const storageRecord = await Storage.findById(id);
        if (!storageRecord) {
            return res.status(404).json({ success: false, message: "Storage record not found" });
        }

        const transaction = await Transaction.findById(storageRecord.transaction);
        const isFarmer = storageRecord.farmer.toString() === req.user.userId;
        const isBuyer = transaction && transaction.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this storage record" });
        }

        if (storageRecord.status === "released") {
            return res.status(400).json({ success: false, message: "Released storage records cannot be deleted." });
        }

        const transactionId = storageRecord.transaction;

        await Storage.findByIdAndDelete(id);

        // Sync transaction storage cost
        await syncTransactionStorageCost(transactionId);

        res.status(200).json({
            success: true,
            message: "Storage record deleted successfully"
        });

    } catch (error) {
        console.error("Delete storage error:", error);
        res.status(500).json({ success: false, message: "Server error deleting storage record" });
    }
};

module.exports = {
    createStorageFromTransaction,
    getMyStorage,
    getStorageById,
    updateStorage,
    updateStorageStatus,
    deleteStorage
};
