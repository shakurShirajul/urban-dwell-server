import mongoose from "mongoose";

const apartmenttSchema = new mongoose.Schema({
    apartments_image: {
        type: String,
        required: true,
    },
    apartments_floor: {
        type: String,
        required: true,
    },
    apartments_block_name: {
        type: String,
        required: true,
    },
    apartments_no: {
        type: String,
        required: true,
    },
    apartments_rent:{
        type: Number,
        required: true,
    }
})

export const Apartments = mongoose.model("apartments", apartmenttSchema)