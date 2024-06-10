import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
    },
    rent: {
        type: Number,
        required: true,
    },
    month: {
        type: String,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    coupon: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

export const Payments = mongoose.model("payments", paymentSchema)