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
    questiontype: {
        type: String,
        enum: ["withid", "withoutid"],
        required: true,
    },
    questionsIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
        },
    ],
    questions: {},
    testid: {
        unique: true,
        type: String,
        required: true,
    },
    archive: {
        type: Boolean,
        default: false,
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

const CustomTest = mongoose.model("customtest", customTestSchema);

module.exports = CustomTest;
