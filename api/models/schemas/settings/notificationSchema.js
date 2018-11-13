const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ShippingAlertSchema = new Schema({
    fulfillment: {
        type: Boolean,
        default: true
    },
    currier: {
        type: Boolean,
        default: true
    },
    collect: {
        type: Boolean,
        default: true
    }
}, {_id: false});

let SurveySchema = new Schema({
    status: {
        type: Boolean,
        default: true
    },

    after_collect: {
        type: Number,
        default: 2
    },

    after_fulfillment: {
        type: Number,
        default: 14
    }
}, {_id: false});

let NotificationSchema = new Schema({
    order_confirmation: {
        type: Boolean,
        default: false
    },

    welcome: {
        type: Boolean,
        default: true
    },

    shipping_alert: {
        type: ShippingAlertSchema,
        default: true
    },

    satisfaction_survey: {
        type: SurveySchema,
        default: true
    },
}, {_id: false});

module.exports = NotificationSchema;
