const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    message: {
        type: String,
        required: true
    },
    image: {
        type: String
        // You might want to add more validation or customize as needed
    }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
