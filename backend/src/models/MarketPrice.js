const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema(
    {
        cropName: {
            type: String,
            required: [true, "Crop name is required"],
            trim: true
        },
        cropType: {
            type: String,
            trim: true
        },
        marketName: {
            type: String,
            required: [true, "Market name is required"],
            trim: true
        },
        state: {
            type: String,
            required: [true, "State is required"],
            trim: true
        },
        district: {
            type: String,
            required: [true, "District is required"],
            trim: true
        },
        marketLocation: {
            type: String,
            trim: true
        },
        minPrice: {
            type: Number,
            required: [true, "Minimum price is required"],
            min: [0, "Minimum price cannot be negative"]
        },
        maxPrice: {
            type: Number,
            required: [true, "Maximum price is required"],
            min: [0, "Maximum price cannot be negative"]
        },
        modalPrice: {
            type: Number,
            required: [true, "Modal price is required"],
            min: [0, "Modal price cannot be negative"],
            validate: {
                validator: function (val) {
                    if (this.minPrice !== undefined && this.maxPrice !== undefined) {
                        return val >= this.minPrice && val <= this.maxPrice;
                    }
                    return true;
                },
                message: "Modal price must be between minimum and maximum price"
            }
        },
        unit: {
            type: String,
            required: [true, "Unit is required"],
            default: "quintal",
            trim: true
        },
        priceDate: {
            type: Date,
            required: [true, "Price date is required"],
            default: Date.now
        },
        variety: {
            type: String,
            trim: true
        },
        lastSyncedAt: {
            type: Date
        },
        source: {
            type: String,
            trim: true,
            default: "Development Sample Data"
        }
    },
    {
        timestamps: true
    }
);

// Compound index to ensure uniqueness of market price records from government/sample ingestion
marketPriceSchema.index(
    { cropName: 1, marketName: 1, state: 1, district: 1, priceDate: 1, variety: 1 },
    { unique: true, sparse: true }
);

module.exports = mongoose.model("MarketPrice", marketPriceSchema);

