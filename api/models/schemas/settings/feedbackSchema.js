const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let reviewLinksSchema = new Schema({
    url: {
        type: String,
        default: ''
    },

    title: {
        type: String,
        default: ''
    }
}, {_id: false});

let FeedbackSchema = new Schema({
    notify_stars: {
        type: Number,
        enum: [1,2,3,4],
        default: 4
    },

    review_links: {
        type: [reviewLinksSchema],
        default: [{},{},{}]
    }
}, {_id: false});

module.exports = FeedbackSchema;