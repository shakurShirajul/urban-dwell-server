import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    user_name : {
        type : String,
        required: true,
    },
    user_email : {
        type: String,
        required: true,
    },
    user_image :{
        type: String,
        required: true,
    },
    user_status : {
        type: String,
        default: "user",
    },
    user_join: {
        type: Date,
        default: Date.now,
    }
})

export const Users = mongoose.model("users", userSchema)