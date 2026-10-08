const mongoose = require("mongoose");
require("dotenv").config();
const { syncGovernmentMarketPrices } = require("../services/governmentMarketPriceService");

async function runSyncScript() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/humanlink";
  console.log("Connecting to MongoDB for Government Market Price Sync...");
  
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully.");

    // Options for sync (e.g. Punjab filter for demo preparation)
    const options = {
      state: "Punjab",
      limit: 100
    };

    console.log(`Starting Government Mandi Data Sync with options:`, options);
    const result = await syncGovernmentMarketPrices(options);
    console.log("\n--- GOV MANDI SYNC RESULT ---");
    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error("Sync script error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

runSyncScript();
