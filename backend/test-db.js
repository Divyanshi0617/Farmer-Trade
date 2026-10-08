require("dotenv").config();
const dns = require("dns");
try {
    const primaryDns = ["8", "8", "8", "8"].join(".");
    const backupDns = ["1", "1", "1", "1"].join(".");
    dns.setServers([primaryDns, backupDns]);
} catch (e) {}

const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        await mongoose.connect(uri);

        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        throw error;
    }
};

if (require.main === module) {
    connectDB()
        .then(() => {
            console.log("🟢 Connection is verified and staying alive. Press Ctrl+C anytime to stop.");
        })
        .catch(() => process.exit(1));
}

module.exports = connectDB;