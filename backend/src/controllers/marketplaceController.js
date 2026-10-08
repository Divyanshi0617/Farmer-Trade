const Crop = require("../models/Crop");
const mongoose = require("mongoose");

// ============================
// GET AVAILABLE CROPS (BUYER MARKETPLACE)
// ============================
const getMarketplaceCrops = async (req, res) => {
    try {
        const { crop, state, district, minQuantity, maxQuantity, minPrice, maxPrice, search } = req.query;

        // Base filter: ONLY available crops
        const filter = { status: "available" };

        if (crop && crop.trim()) {
            filter.cropName = { $regex: new RegExp(`^${crop.trim()}$`, "i") };
        }

        if (state && state.trim()) {
            filter.state = { $regex: new RegExp(`^${state.trim()}$`, "i") };
        }

        if (district && district.trim()) {
            filter.district = { $regex: new RegExp(`^${district.trim()}$`, "i") };
        }

        if (minQuantity || maxQuantity) {
            filter.quantity = {};
            if (minQuantity) filter.quantity.$gte = Number(minQuantity);
            if (maxQuantity) filter.quantity.$lte = Number(maxQuantity);
        }

        if (minPrice || maxPrice) {
            filter.expectedPrice = {};
            if (minPrice) filter.expectedPrice.$gte = Number(minPrice);
            if (maxPrice) filter.expectedPrice.$lte = Number(maxPrice);
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { cropName: searchRegex },
                { cropType: searchRegex },
                { district: searchRegex },
                { state: searchRegex },
                { village: searchRegex }
            ];
        }

        const crops = await Crop.find(filter)
            .populate("farmer", "name location")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: crops.length,
            crops
        });
    } catch (error) {
        console.error("Get marketplace crops error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching marketplace crops"
        });
    }
};

// ============================
// GET SINGLE MARKETPLACE CROP DETAILS
// ============================
const getMarketplaceCropById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({
                success: false,
                message: "Crop not found"
            });
        }

        const crop = await Crop.findById(id).populate("farmer", "name location phone");

        if (!crop) {
            return res.status(404).json({
                success: false,
                message: "Crop not found"
            });
        }

        res.status(200).json({
            success: true,
            crop
        });
    } catch (error) {
        console.error("Get marketplace crop details error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching crop details"
        });
    }
};

module.exports = {
    getMarketplaceCrops,
    getMarketplaceCropById
};
