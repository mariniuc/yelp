var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
    name: String,
    image: {url: String, public_id: String},
    description: String,
    price: String,
    location: String,
    coordinates: Array,
    createdAt: {type: Date, default: Date.now},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

module.exports = mongoose.model("Campground", campgroundSchema);
