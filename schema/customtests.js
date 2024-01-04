const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userid: {
        type: String,
    },
    name: {
        type: String,
    },
    totalscore: {
        type: String,
    },
});

const isSponsoredSchema = new mongoose.Schema({
    state: {
        type: Boolean,
        default: false,
    },
    by: {
        type: String,
    },
    image: {
        type: String,
    },
});

const customTestSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    isSponsored: isSponsoredSchema,
    questionmodel: {
        type: String,
        required: true,
    },
    questionsIds: [{ type: mongoose.Schema.Types.ObjectId }],
    testid: {
        type: String,
        required: true,
    },
    archive: {
        type: Boolean,
        default: true,
    },
    usersconnected: {
        type: [String],
        default: [],
    },
    usersattended: [userSchema],
    date: {
        type: Date,
        default: Date.now,
    },
});

const CustomTest = mongoose.model("CustomTest", customTestSchema);

module.exports = CustomTest;
