const mongoose = require("mongoose");

const pastQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    options: {
        type: {
            a: String,
            b: String,
            c: String,
            d: String,
        },
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    explanation: {
        type: String,
        default: "",
    },
    images: {
        qn: String,
        a: String,
        b: String,
        c: String,
        d: String,
        exp: String,
    },
    yr: { type: String, required: true },
    af: { type: String, required: true },
    isadded: {
        state: {
            type: Boolean,
            default: false,
        },
        by: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    isreported: {
        state: {
            type: Boolean,
            default: false,
        },
        by: {
            type: String,
        },
        message: {
            type: String,
        },
        date: {
            type: Date,
        },
    },
});

const PastQuestion = mongoose.model("Pastquestion", pastQuestionSchema);

module.exports = PastQuestion;
