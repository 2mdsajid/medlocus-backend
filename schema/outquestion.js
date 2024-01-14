const mongoose = require("mongoose");

const outQuestionSchema = new mongoose.Schema({
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
    subject: {
        type: String,
        default: "",
    },
    chapter: {
        type: String,
        default: "",
    },
    mergedunit: {
        type: String,
        default: "",
    },
});

const Outquestion = mongoose.model("Outquestion", outQuestionSchema);

module.exports = Outquestion;
