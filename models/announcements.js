import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    announce_title : {
        type : String,
        required: true,
    },
    announce_description : {
        type: String,
        required: true,
    },
    announce_date :{
        type: Date,
        default: Date.now,
    },
    announce_author : {
        type: String,
        required: true,
    },
})

export const Announcements = mongoose.model("announcements", announcementSchema)