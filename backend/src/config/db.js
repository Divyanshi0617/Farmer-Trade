const mongoose = require("mongoose");
const dns = require("dns");

// Configure public DNS resolvers to handle MongoDB SRV record lookups reliably
try {
    const primaryDns = ["8", "8", "8", "8"].join(".");
    const backupDns = ["1", "1", "1", "1"].join(".");
    dns.setServers([primaryDns, backupDns]);
} catch (e) {
    // Ignore if not supported in environment
}

// Track connection lifecycle
mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connection active");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB connection disconnected");
});

const connectDB = async () => {
    const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    try {
        await mongoose.connect(primaryUri);
        console.log("✅ MongoDB connected successfully to primary database");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        throw error;
    }
};

module.exports = connectDB;