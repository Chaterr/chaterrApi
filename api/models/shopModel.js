var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const Settings = require('./settingsModel');

var ShopSchema = new Schema({
    
    ecommercePlatform: {
        type: String,
        lowercase: true,
        enum: ['shopify', 'magento'],
        required: 'Kindly enter the shop platform (shopify, magento etc...)'
    },

    company: {
        type: String,
        upperCase: true
    },

    project: {
        type: String,
        upperCase: true
    },

    is_active: {
        type: Boolean,
        default: true
    },

    domain: {
        type: String,
        unique: true,
        required: 'Kindly enter the shop domain'
    },

    primary_locale: {
        type: String
    },

    platform_shop_id: {
        type: String,
        required: 'missing shop platform id'
    },

    auth: {
        type: Schema.Types.Mixed,
        required: 'Kindly enter shop access token',
        hidden: true
    },

    title: {
        type: String,
        required: 'missing shop name'
    },

    address1: String,
    address2: String,
    
    club_url: String,
    deal_url: String,
    
    bot_name: {
        type: String,
        lowercase: true,
        default: 'sally'
    },

    facebook_page: String,

    support_email: {
        type: String,
        required: 'Kindly enter support email'
    },

    platform_plan: String,

    phone: String,
    owner_email: {
        type: String,
    },

    owner_name: String,

    created_at: {
        type: Date,
        default: Date.now
    },
    
    currency: {
        type: String,
        enum: ['USD', 'ILS'],
        default: 'USD'
    },
    
    country_code: {
        type: String,
        enum: ['US', 'IL'],
        default: 'US'
    },

    webhooks: [],

    shop_demo_type: {
        type: Number,
        default: 0
    },

    shop_facebook_page: {
        type: String,
        default: "146429806138447"
    },

    shop_auth_userpass: {
        type: String,
        default: true
    }

}, { collection: 'shops', versionKey: false, id: false, toObject: { virtuals: true }});

ShopSchema.virtual('settings', {
    ref: 'Settings',
    localField: 'domain',
    foreignField: 'shop_domain',
    justOne: true
}, {_id: false});

ShopSchema.virtual('pfn').get(function () {
    return `${this.company}.${this.project}`;
});

ShopSchema.static('findByDomain', function (domain, callback) {
    return this.findOne({ domain: domain }, callback);
});

module.exports = mongoose.model('Shop', ShopSchema);