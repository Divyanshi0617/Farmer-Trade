const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    createStorageFromTransaction,
    getMyStorage,
    getStorageById,
    updateStorage,
    updateStorageStatus,
    deleteStorage
} = require("../controllers/storageController");

router.use(protect);

router.post("/from-transaction/:transactionId", createStorageFromTransaction);
router.get("/my", getMyStorage);
router.get("/:id", getStorageById);
router.patch("/:id", updateStorage);
router.patch("/:id/status", updateStorageStatus);
router.delete("/:id", deleteStorage);

module.exports = router;
