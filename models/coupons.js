import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    coupon_Code: {
        type: String,
        required: true,
    },
    coupon_Discount: {
        type: Number,
        required: true,
    },
    coupon_Description: {
        type: String,
        required: true,
    },
})

export const Coupons = mongoose.model("coupons", couponSchema)