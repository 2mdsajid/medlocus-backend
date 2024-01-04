const mongoose = require("mongoose");

const nonUserSchema = new mongoose.Schema({
    uuid: {
        type: String,
        required: true
    },
    ip: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now(),
    }
});

const NonUser = mongoose.model("Nonuser", nonUserSchema);

module.exports = NonUser;
