const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
    {
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Buyer ID is required"]
        },
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Farmer ID is required"]
        },
        crop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            required: [true, "Crop ID is required"]
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0.01, "Quantity must be greater than 0"]
        },
        offeredPrice: {
            type: Number,
            required: [true, "Offered price is required"],
            min: [0, "Offered price cannot be negative"]
        },
        message: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "cancelled"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Offer", offerSchema);
