const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        messageType: {
            type: String,
            enum: ["text", "deal_offer", "quick_reply"],
            default: "text"
        },
        dealData: {
            price: {
                type: Number
            },
            quantity: {
                type: Number
            },
            unit: {
                type: String
            },
            cropTitle: {
                type: String
            },
            status: {
                type: String,
                enum: ["pending", "accepted", "rejected"],
                default: "pending"
            }
        },
        read: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model("Message", messageSchema);
