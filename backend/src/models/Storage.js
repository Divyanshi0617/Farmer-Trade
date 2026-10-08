const mongoose = require("mongoose");

const storageSchema = new mongoose.Schema(
    {
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            required: [true, "Transaction ID is required"]
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
        storageName: {
            type: String,
            required: [true, "Storage name is required"],
            trim: true
        },
        storageLocation: {
            type: String,
            required: [true, "Storage location is required"],
            trim: true
        },
        storageType: {
            type: String,
            enum: ["warehouse", "cold_storage", "grain_storage", "farmer_storage", "other"],
            default: "warehouse"
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [0, "Quantity cannot be negative"]
        },
        entryDate: {
            type: Date,
            required: [true, "Entry date is required"],
            default: Date.now
        },
        expectedExitDate: {
            type: Date
        },
        actualExitDate: {
            type: Date
        },
        storageCost: {
            type: Number,
            default: 0,
            min: [0, "Storage cost cannot be negative"]
        },
        status: {
            type: String,
            enum: ["stored", "partially_released", "released", "cancelled"],
            default: "stored"
        },
        notes: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

storageSchema.index({ transaction: 1 });
storageSchema.index({ farmer: 1, status: 1 });

module.exports = mongoose.model("Storage", storageSchema);
