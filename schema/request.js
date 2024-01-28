const mongoose = require('mongoose');

const userRequest = new mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const Request = mongoose.model('Request', userRequest);

module.exports = Request;
