const express = require("express");

const {
    register,
    login,
    getProfile,
    updateProfile
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Get Profile
router.get("/me", protect, getProfile);

// Update Profile
router.put("/profile", protect, updateProfile);

module.exports = router;