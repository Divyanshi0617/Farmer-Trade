const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
    {
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        cropName: {
            type: String,
            required: true,
            trim: true
        },
        cropType: {
            type: String,
            trim: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [0, "Quantity cannot be negative"]
        },
        unit: {
            type: String,
            required: true,
            trim: true
        },
        expectedPrice: {
            type: Number,
            required: true,
            min: [0, "Expected price cannot be negative"]
        },
        harvestDate: {
            type: Date
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        district: {
            type: String,
            required: true,
            trim: true
        },
        village: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ["available", "sold", "inactive"],
            default: "available"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Crop", cropSchema);
