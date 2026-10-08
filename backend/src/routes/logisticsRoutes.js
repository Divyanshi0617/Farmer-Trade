const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    createLogisticsFromTransaction,
    getMyLogistics,
    getLogisticsById,
    updateLogistics,
    updateLogisticsStatus,
    deleteLogistics
} = require("../controllers/logisticsController");

router.use(protect);

router.post("/from-transaction/:transactionId", createLogisticsFromTransaction);
router.get("/my", getMyLogistics);
router.get("/:id", getLogisticsById);
router.patch("/:id", updateLogistics);
router.patch("/:id/status", updateLogisticsStatus);
router.delete("/:id", deleteLogistics);

module.exports = router;
