const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            }
        ],
        crop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Crop",
            default: null
        },
        offer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Offer",
            default: null
        },
        lastMessage: {
            text: {
                type: String,
                default: ""
            },
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            read: {
                type: Boolean,
                default: false
            }
        },
        unreadCounts: {
            type: Map,
            of: Number,
            default: () => new Map()
        }
    },
    {
        timestamps: true
    }
);

// Index for quick queries on participants and recency
conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
