import mongoose from "mongoose";

const apartmentSchema = new mongoose.Schema({
    apartment_image: {
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
    }
})

export const Apartments = mongoose.model("apartments", apartmentSchema)