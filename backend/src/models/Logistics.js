const mongoose = require("mongoose");

const logisticsSchema = new mongoose.Schema(
    {
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            required: [true, "Transaction ID is required"],
            unique: true
        },
        farmer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Farmer ID is required"]
        },
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Buyer ID is required"]
        },
        crop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            required: [true, "Crop ID is required"]
        },
        pickupLocation: {
            type: String,
            required: [true, "Pickup location is required"],
            trim: true
        },
        deliveryLocation: {
            type: String,
            required: [true, "Delivery location is required"],
            trim: true
        },
        transportType: {
            type: String,
            enum: ["tractor", "truck", "tempo", "pickup", "other"],
            default: "truck"
        },
        vehicleNumber: {
            type: String,
            trim: true,
            default: ""
        },
        driverName: {
            type: String,
            trim: true,
            default: ""
        },
        driverPhone: {
            type: String,
            trim: true,
            default: ""
        },
        transportCost: {
            type: Number,
            default: 0,
            min: [0, "Transport cost cannot be negative"]
        },
        estimatedPickupDate: {
            type: Date
        },
        estimatedDeliveryDate: {
            type: Date
        },
        actualPickupDate: {
            type: Date
        },
        actualDeliveryDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ["requested", "assigned", "pickup_scheduled", "picked_up", "in_transit", "delivered", "cancelled"],
            default: "requested"
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

logisticsSchema.index({ farmer: 1, status: 1 });
logisticsSchema.index({ buyer: 1, status: 1 });

module.exports = mongoose.model("Logistics", logisticsSchema);
