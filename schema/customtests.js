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

const customTestSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isOrg: {
        state: {
            type: Boolean,
            default: false
        },
        by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization'
        }
    },
    isLocked: {
        state: {
            type: Boolean,
            default: false,
        },
        code: {
            type: String,
            default: '',
        }
    },
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
        default: false,
    },
    usersconnected: {
        type: [String],
        default: [],
    },
    usersattended: [userSchema],
    keysUsed: [],
    date: {
        type: Date,
        default: Date.now,
    },
});

const CustomTest = mongoose.model("Customtest", customTestSchema);

module.exports = CustomTest;
