const mongoose = require("mongoose");
const Comment  = require("./comment");


const campgroundSchema = new mongoose.Schema({
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

campgroundSchema.pre('remove', async function (next) {
    try {
        await Comment.deleteMany({
            "_id": {
                $in: this.comments
            }
        });
        next();
    } catch (err) {
        next(err)
    }
});
module.exports = mongoose.model("Campground", campgroundSchema);
