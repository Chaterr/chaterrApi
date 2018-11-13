var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const communicationSchema = new Schema({
    default_communication: {
        type: String,
        lowerCase: true,
        enum: ['sms', 'bot', 'email'],
        default: 'bot'
    }
}, {_id: false, versionKey: false});

var BuyerSchema = new Schema({
    
    shop_id: {
        type: String,
        required: 'Kindly enter shop_id'
    },

    external_id: {
        type: String,
        unique: true,
        required: 'Kindly enter buyer external ID'
    },

    first_name: {
        type: String
    },

    last_name: {
        type: String
    },

    default_address: {
        type: Object
    },

    accepts_marketing: {
        type: Boolean
    },

    accept_language: {
        type: String
    },

    user_email: {
        type: String,
    },

    birthday: {
        type: Date,
    },

    user_phone: {
        type: String,
    },

    messenger_details: [],

    default_communication: communicationSchema,

}, { collection: 'buyers', versionKey: false, toObject: { virtuals: true } });

BuyerSchema.virtual('orders', {
    ref: 'Order',
    localField: 'external_id',
    foreignField: 'buyer_id',
    justOne: false
});

BuyerSchema.virtual('users', {
    ref: 'User',
    localField: 'external_id',
    foreignField: 'buyer_id',
    justOne: false
});

BuyerSchema.virtual('shop', {
    ref: 'Shop',
    localField: 'shop_id',
    foreignField: 'platform_shop_id',
    justOne: true
}, {_id: false});

module.exports = mongoose.model('Buyer', BuyerSchema);