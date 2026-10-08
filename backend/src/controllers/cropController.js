const Crop = require("../models/Crop");

// Check if user is a farmer
const isFarmer = (req, res, next) => {
    if (req.user.role !== "farmer") {
        return res.status(403).json({ success: false, message: "Only farmers can perform this action" });
    }
    next();
};

// ============================
// CREATE CROP
// ============================
const createCrop = async (req, res) => {
    try {
        const { cropName, cropType, quantity, unit, expectedPrice, harvestDate, state, district, village, description } = req.body;

        // Validation
        if (!cropName) return res.status(400).json({ success: false, message: "Crop name is required" });
        if (!quantity || quantity <= 0) return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
        if (!unit) return res.status(400).json({ success: false, message: "Unit is required" });
        if (expectedPrice === undefined || expectedPrice < 0) return res.status(400).json({ success: false, message: "Expected price must be greater than or equal to 0" });
        if (!state) return res.status(400).json({ success: false, message: "State is required" });
        if (!district) return res.status(400).json({ success: false, message: "District is required" });

        const newCrop = await Crop.create({
            farmer: req.user.userId,
            cropName,
            cropType,
            quantity,
            unit,
            expectedPrice,
            harvestDate,
            state,
            district,
            village,
            description
        });

        res.status(201).json({
            success: true,
            message: "Crop added successfully",
            crop: newCrop
        });
    } catch (error) {
        console.error("Create crop error:", error);
        res.status(500).json({ success: false, message: "Server error creating crop" });
    }
};

// ============================
// GET MY CROPS
// ============================
const getMyCrops = async (req, res) => {
    try {
        const crops = await Crop.find({ farmer: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            crops
        });
    } catch (error) {
        console.error("Get my crops error:", error);
        res.status(500).json({ success: false, message: "Server error fetching crops" });
    }
};

// ============================
// GET CROP BY ID
// ============================
const getCropById = async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id);
        
        if (!crop) {
            return res.status(404).json({ success: false, message: "Crop not found" });
        }

        // Verify ownership
        if (crop.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to view this crop" });
        }

        res.status(200).json({
            success: true,
            crop
        });
    } catch (error) {
        console.error("Get crop error:", error);
        res.status(500).json({ success: false, message: "Server error fetching crop details" });
    }
};

// ============================
// UPDATE CROP
// ============================
const updateCrop = async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id);
        
        if (!crop) {
            return res.status(404).json({ success: false, message: "Crop not found" });
        }

        // Verify ownership
        if (crop.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this crop" });
        }

        const { cropName, cropType, quantity, unit, expectedPrice, harvestDate, state, district, village, description, status } = req.body;

        if (status && !["available", "sold", "inactive"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        if (quantity !== undefined && quantity <= 0) return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
        if (expectedPrice !== undefined && expectedPrice < 0) return res.status(400).json({ success: false, message: "Expected price must be greater than or equal to 0" });

        if (cropName) crop.cropName = cropName;
        if (cropType !== undefined) crop.cropType = cropType;
        if (quantity) crop.quantity = quantity;
        if (unit) crop.unit = unit;
        if (expectedPrice !== undefined) crop.expectedPrice = expectedPrice;
        if (harvestDate !== undefined) crop.harvestDate = harvestDate;
        if (state) crop.state = state;
        if (district) crop.district = district;
        if (village !== undefined) crop.village = village;
        if (description !== undefined) crop.description = description;
        if (status) crop.status = status;

        await crop.save();

        res.status(200).json({
            success: true,
            message: "Crop updated successfully",
            crop
        });
    } catch (error) {
        console.error("Update crop error:", error);
        res.status(500).json({ success: false, message: "Server error updating crop" });
    }
};

// ============================
// DELETE CROP
// ============================
const deleteCrop = async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id);
        
        if (!crop) {
            return res.status(404).json({ success: false, message: "Crop not found" });
        }

        // Verify ownership
        if (crop.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this crop" });
        }

        await crop.deleteOne();

        res.status(200).json({
            success: true,
            message: "Crop deleted successfully"
        });
    } catch (error) {
        console.error("Delete crop error:", error);
        res.status(500).json({ success: false, message: "Server error deleting crop" });
    }
};

// ============================
// UPDATE CROP STATUS
// ============================
const updateCropStatus = async (req, res) => {
    try {
        const crop = await Crop.findById(req.params.id);
        
        if (!crop) {
            return res.status(404).json({ success: false, message: "Crop not found" });
        }

        // Verify ownership
        if (crop.farmer.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: "You are not authorized to update this crop" });
        }

        const { status } = req.body;
        if (!status || !["available", "sold", "inactive"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        crop.status = status;
        await crop.save();

        res.status(200).json({
            success: true,
            message: "Crop status updated successfully",
            crop
        });
    } catch (error) {
        console.error("Update crop status error:", error);
        res.status(500).json({ success: false, message: "Server error updating crop status" });
    }
};

module.exports = {
    isFarmer,
    createCrop,
    getMyCrops,
    getCropById,
    updateCrop,
    deleteCrop,
    updateCropStatus
};
