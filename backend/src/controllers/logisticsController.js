const Logistics = require("../models/Logistics");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// Helper to recalculate transaction totals
const syncTransactionTransportCost = async (transactionId, newTransportCost) => {
    const transaction = await Transaction.findById(transactionId);
    if (transaction) {
        transaction.transportCost = Number(newTransportCost);
        transaction.totalCosts = transaction.transportCost + transaction.loadingCost + transaction.storageCost + transaction.otherCosts;
        transaction.netRealisation = transaction.grossAmount - transaction.totalCosts;
        await transaction.save();
    }
    return transaction;
};

// ============================
// CREATE LOGISTICS FROM TRANSACTION
// ============================
const createLogisticsFromTransaction = async (req, res) => {
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
            return res.status(403).json({ success: false, message: "You are not authorized to create logistics for this transaction" });
        }

        // Check if logistics already exists for this transaction
        const existingLogistics = await Logistics.findOne({ transaction: transactionId });
        if (existingLogistics) {
            return res.status(400).json({
                success: false,
                message: "A logistics record already exists for this transaction.",
                logisticsId: existingLogistics._id
            });
        }

        const {
            pickupLocation,
            deliveryLocation,
            transportType,
            vehicleNumber,
            driverName,
            driverPhone,
            transportCost,
            estimatedPickupDate,
            estimatedDeliveryDate,
            notes
        } = req.body;

        if (!pickupLocation || !pickupLocation.trim()) {
            return res.status(400).json({ success: false, message: "Pickup location is required" });
        }

        if (!deliveryLocation || !deliveryLocation.trim()) {
            return res.status(400).json({ success: false, message: "Delivery location is required" });
        }

        const numericTransportCost = transportCost !== undefined ? Number(transportCost) : 0;
        if (isNaN(numericTransportCost) || numericTransportCost < 0) {
            return res.status(400).json({ success: false, message: "Transport cost must be a number greater than or equal to 0" });
        }

        // Create logistics record
        const newLogistics = await Logistics.create({
            transaction: transaction._id,
            farmer: transaction.farmer,
            buyer: transaction.buyer,
            crop: transaction.crop,
            pickupLocation: pickupLocation.trim(),
            deliveryLocation: deliveryLocation.trim(),
            transportType: transportType || "truck",
            vehicleNumber: vehicleNumber ? vehicleNumber.trim() : "",
            driverName: driverName ? driverName.trim() : "",
            driverPhone: driverPhone ? driverPhone.trim() : "",
            transportCost: numericTransportCost,
            estimatedPickupDate: estimatedPickupDate || null,
            estimatedDeliveryDate: estimatedDeliveryDate || null,
            status: "requested",
            notes: notes ? notes.trim() : ""
        });

        // Sync cost to transaction
        if (numericTransportCost >= 0) {
            await syncTransactionTransportCost(transaction._id, numericTransportCost);
        }

        const populatedLogistics = await Logistics.findById(newLogistics._id)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("buyer", "name email phone businessName")
            .populate("crop", "cropName cropType quantity unit");

        res.status(201).json({
            success: true,
            message: "Logistics record created successfully",
            logistics: populatedLogistics
        });

    } catch (error) {
        console.error("Create logistics error:", error);
        res.status(500).json({ success: false, message: "Server error creating logistics" });
    }
};

// ============================
// GET MY LOGISTICS (ROLE-BASED)
// ============================
const getMyLogistics = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === "farmer") {
            filter.farmer = req.user.userId;
        } else if (req.user.role === "buyer") {
            filter.buyer = req.user.userId;
        } else {
            return res.status(403).json({ success: false, message: "Unauthorized role" });
        }

        const logisticsList = await Logistics.find(filter)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("buyer", "name email phone businessName")
            .populate("crop", "cropName cropType quantity unit")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: logisticsList.length,
            logistics: logisticsList
        });

    } catch (error) {
        console.error("Get my logistics error:", error);
        res.status(500).json({ success: false, message: "Server error fetching logistics" });
    }
};

// ============================
// GET LOGISTICS BY ID
// ============================
const getLogisticsById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Logistics record not found" });
        }

        const logistics = await Logistics.findById(id)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("buyer", "name email phone businessName")
            .populate("crop", "cropName cropType quantity unit");

        if (!logistics) {
            return res.status(404).json({ success: false, message: "Logistics record not found" });
        }

        const isFarmer = logistics.farmer._id.toString() === req.user.userId;
        const isBuyer = logistics.buyer._id.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to view this logistics record" });
        }

        res.status(200).json({
            success: true,
            logistics
        });

    } catch (error) {
        console.error("Get logistics by id error:", error);
        res.status(500).json({ success: false, message: "Server error fetching logistics details" });
    }
};

// ============================
// UPDATE LOGISTICS
// ============================
const updateLogistics = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Logistics record not found" });
        }

        const logistics = await Logistics.findById(id);
        if (!logistics) {
            return res.status(404).json({ success: false, message: "Logistics record not found" });
        }

        const isFarmer = logistics.farmer.toString() === req.user.userId;
        const isBuyer = logistics.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this logistics record" });
        }

        const {
            pickupLocation,
            deliveryLocation,
            transportType,
            vehicleNumber,
            driverName,
            driverPhone,
            transportCost,
            estimatedPickupDate,
            estimatedDeliveryDate,
            actualPickupDate,
            actualDeliveryDate,
            notes
        } = req.body;

        if (pickupLocation !== undefined) {
            if (!pickupLocation || !pickupLocation.trim()) {
                return res.status(400).json({ success: false, message: "Pickup location cannot be empty" });
            }
            logistics.pickupLocation = pickupLocation.trim();
        }

        if (deliveryLocation !== undefined) {
            if (!deliveryLocation || !deliveryLocation.trim()) {
                return res.status(400).json({ success: false, message: "Delivery location cannot be empty" });
            }
            logistics.deliveryLocation = deliveryLocation.trim();
        }

        if (transportType !== undefined) logistics.transportType = transportType;
        if (vehicleNumber !== undefined) logistics.vehicleNumber = vehicleNumber.trim();
        if (driverName !== undefined) logistics.driverName = driverName.trim();
        if (driverPhone !== undefined) logistics.driverPhone = driverPhone.trim();
        if (estimatedPickupDate !== undefined) logistics.estimatedPickupDate = estimatedPickupDate;
        if (estimatedDeliveryDate !== undefined) logistics.estimatedDeliveryDate = estimatedDeliveryDate;
        if (actualPickupDate !== undefined) logistics.actualPickupDate = actualPickupDate;
        if (actualDeliveryDate !== undefined) logistics.actualDeliveryDate = actualDeliveryDate;
        if (notes !== undefined) logistics.notes = notes.trim();

        if (transportCost !== undefined) {
            const numericCost = Number(transportCost);
            if (isNaN(numericCost) || numericCost < 0) {
                return res.status(400).json({ success: false, message: "Transport cost must be a number greater than or equal to 0" });
            }
            logistics.transportCost = numericCost;
            await syncTransactionTransportCost(logistics.transaction, numericCost);
        }

        await logistics.save();

        const populatedLogistics = await Logistics.findById(logistics._id)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("buyer", "name email phone businessName")
            .populate("crop", "cropName cropType quantity unit");

        res.status(200).json({
            success: true,
            message: "Logistics record updated successfully",
            logistics: populatedLogistics
        });

    } catch (error) {
        console.error("Update logistics error:", error);
        res.status(500).json({ success: false, message: "Server error updating logistics" });
    }
};

// ============================
// UPDATE LOGISTICS STATUS
// ============================
const updateLogisticsStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Logistics record not found" });
        }

        const validStatuses = ["requested", "assigned", "pickup_scheduled", "picked_up", "in_transit", "delivered", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid logistics status value" });
        }

        const logistics = await Logistics.findById(id);
        if (!logistics) {
            return res.status(404).json({ success: false, message: "Logistics record not found" });
        }

        const isFarmer = logistics.farmer.toString() === req.user.userId;
        const isBuyer = logistics.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to update status for this logistics record" });
        }

        const currentStatus = logistics.status;

        // Final states check
        if (currentStatus === "delivered" || currentStatus === "cancelled") {
            return res.status(400).json({ success: false, message: `Logistics is already in '${currentStatus}' status and cannot be changed.` });
        }

        // Transition rule checks
        const allowedTransitions = {
            requested: ["assigned", "cancelled"],
            assigned: ["pickup_scheduled", "cancelled"],
            pickup_scheduled: ["picked_up", "cancelled"],
            picked_up: ["in_transit", "cancelled"],
            in_transit: ["delivered", "cancelled"]
        };

        if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
            return res.status(400).json({ success: false, message: `Cannot transition logistics status from '${currentStatus}' to '${status}'.` });
        }

        logistics.status = status;
        if (status === "picked_up" && !logistics.actualPickupDate) {
            logistics.actualPickupDate = new Date();
        }
        if (status === "delivered" && !logistics.actualDeliveryDate) {
            logistics.actualDeliveryDate = new Date();
        }

        await logistics.save();

        const populatedLogistics = await Logistics.findById(logistics._id)
            .populate("transaction")
            .populate("farmer", "name email phone location")
            .populate("buyer", "name email phone businessName")
            .populate("crop", "cropName cropType quantity unit");

        res.status(200).json({
            success: true,
            message: `Logistics status updated to ${status}`,
            logistics: populatedLogistics
        });

    } catch (error) {
        console.error("Update logistics status error:", error);
        res.status(500).json({ success: false, message: "Server error updating logistics status" });
    }
};

// ============================
// DELETE LOGISTICS
// ============================
const deleteLogistics = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ success: false, message: "Logistics record not found" });
        }

        const logistics = await Logistics.findById(id);
        if (!logistics) {
            return res.status(404).json({ success: false, message: "Logistics record not found" });
        }

        const isFarmer = logistics.farmer.toString() === req.user.userId;
        const isBuyer = logistics.buyer.toString() === req.user.userId;

        if (!isFarmer && !isBuyer) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this logistics record" });
        }

        if (logistics.status === "delivered") {
            return res.status(400).json({ success: false, message: "Delivered logistics records cannot be deleted." });
        }

        const transactionId = logistics.transaction;

        await Logistics.findByIdAndDelete(id);

        // Reset transaction transport cost
        await syncTransactionTransportCost(transactionId, 0);

        res.status(200).json({
            success: true,
            message: "Logistics record deleted successfully"
        });

    } catch (error) {
        console.error("Delete logistics error:", error);
        res.status(500).json({ success: false, message: "Server error deleting logistics record" });
    }
};

module.exports = {
    createLogisticsFromTransaction,
    getMyLogistics,
    getLogisticsById,
    updateLogistics,
    updateLogisticsStatus,
    deleteLogistics
};
