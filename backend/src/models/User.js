const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        role: {
            type: String,
            enum: ["farmer", "buyer", "admin"],
            default: "farmer"
        },

        location: {
            state: {
                type: String,
                trim: true
            },

            district: {
                type: String,
                trim: true
            },

            village: {
                type: String,
                trim: true
            }
        },

        businessName: {
            type: String,
            trim: true
        },

        businessType: {
            type: String,
            trim: true
        },

        address: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);