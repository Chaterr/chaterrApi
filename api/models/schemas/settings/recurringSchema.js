const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let RecurringSchema = new Schema({
    id: Number,
    name: String,
    api_client_id: Number,
    price: String,
    status: String,
    return_url: String,
    billing_on: String,
    created_at: String,
    updated_at: String,
    test: Boolean,
    activated_on: String,
    trial_ends_on: String,
    cancelled_on: String,
    trial_days: Number,
    decorated_return_url: String,
    confirmation_url: String,
}, {versionKey: false});

module.exports = RecurringSchema;