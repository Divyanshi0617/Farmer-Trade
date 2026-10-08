const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
    isFarmer,
    createCrop,
    getMyCrops,
    getCropById,
    updateCrop,
    deleteCrop,
    updateCropStatus
} = require("../controllers/cropController");

const router = express.Router();

// All crop routes require authentication and only farmers can access them
router.use(protect);
router.use(isFarmer);

// Create a crop
router.post("/", createCrop);

// Get my crops
router.get("/my", getMyCrops);

// Get a specific crop
router.get("/:id", getCropById);

// Update a crop
router.put("/:id", updateCrop);

// Delete a crop
router.delete("/:id", deleteCrop);

// Update crop status
router.patch("/:id/status", updateCropStatus);

module.exports = router;
