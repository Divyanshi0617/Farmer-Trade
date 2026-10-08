const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
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
        offer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer",
            required: [true, "Offer ID is required"],
            unique: true
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0, "Quantity cannot be negative"]
        },
        agreedPrice: {
            type: Number,
            required: [true, "Agreed price is required"],
            min: [0, "Agreed price cannot be negative"]
        },
        grossAmount: {
            type: Number,
            required: [true, "Gross amount is required"],
            min: [0, "Gross amount cannot be negative"]
        },
        transportCost: {
            type: Number,
            default: 0,
            min: [0, "Transport cost cannot be negative"]
        },
        loadingCost: {
            type: Number,
            default: 0,
            min: [0, "Loading cost cannot be negative"]
        },
        storageCost: {
            type: Number,
            default: 0,
            min: [0, "Storage cost cannot be negative"]
        },
        otherCosts: {
            type: Number,
            default: 0,
            min: [0, "Other costs cannot be negative"]
        },
        totalCosts: {
            type: Number,
            required: [true, "Total costs is required"],
            min: [0, "Total costs cannot be negative"]
        },
        netRealisation: {
            type: Number,
            required: [true, "Net realisation is required"]
        },
        status: {
            type: String,
            enum: ["initiated", "confirmed", "completed", "cancelled"],
            default: "initiated"
        }
    },
    {
        timestamps: true
    }
);

transactionSchema.index({ farmer: 1, createdAt: -1 });
transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
