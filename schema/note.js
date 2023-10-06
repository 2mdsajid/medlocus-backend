const mongoose = require("mongoose")

const note = mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    noteid: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: false
    },
    subcategory: {
        type: String,
        default: '',
    },
    author: {
        type: String,
        default: 'Aayushma'
    },
    intro: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: false
    },
    introimage: {
        type: String,
        default: ''
    },
    review: {
        type: Boolean,
        default: false
    },
    published: {
        type: Boolean,
        default: true
    },
    keywords: {
        type: String,
        default: ''
    },
    readtime: {
        type: String,
        default: ''
    },
    upvote: {
        type: [String],
        default: []
    },
    downvote: {
        type: [String],
        default: []
    },
    isupdated: {
        state: {
            type: Boolean,
            default: false
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    comments: [
        {
            name: { type: String, default: '' },
            email: { type: String, default: '' },
            comment: { type: String, default: '' },
            likes: {
                type: [String],
                default: []
            },
            replies: [
                {
                    name: { type: String, default: '' },
                    email: { type: String, default: '' },
                    reply: { type: String, default: '' },
                    likes: {
                        type: [String],
                        default: []
                    },
                },
            ],
        },
    ],
    date: {
        type: Date,
        default: Date.now
    },
    views: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    }
});


const Note = mongoose.model('NOTE', note)
module.exports = Note