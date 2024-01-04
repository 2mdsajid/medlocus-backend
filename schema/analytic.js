const mongoose = require("mongoose");

const Score = {
    type: Number,
    default: 0
}

const analyticSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    tests: [{
        test: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CustomTest",
        },
        score: {
            p: {
                t: Score, //total
                c: Score, //correct
                i: Score, //incorrect
            },
            c: {
                t: Score,
                c: Score,
                i: Score,
            },
            b: {
                t: Score,
                c: Score,
                i: Score,
            },
            z: {
                t: Score,
                c: Score,
                i: Score,
            },
            m: {
                t: Score,
                c: Score,
                i: Score,
            }
        },
        timetaken: {
            t: Score, //total time taken
            a: Score, //average time taken
        }
    }],
    nontests: [{
        n: String, //name
        s: Score, //score
        t: {
            type: String,
            enum: ['subjectwise', 'chapterwise', 'unitwise']
        },
        d: {
            type: Date,
            default: Date.now
        },
    }],
    chapterscores:[] //coz i cant append or modify an object containing the k, v pairs
});

const Analytic = mongoose.model("Analytic", analyticSchema);

module.exports = Analytic;
