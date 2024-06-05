import mongoose from "mongoose";

const agreementSchema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true,
    },
    user_email: {
        type: String,
        required: true,
    },
    floor_no: {
        type: Number,
        required: true,
    },
    block_name: {
        type: String,
        required: true,
    },
    apartment_no: {
        type: String,
        required: true,
    },
    rent:{
        type: Number,
        required: true,
    },
    status: {
        type: String,
        default: 'pending'
    }
})

export const Agreement = mongoose.model("agreements", agreementSchema)