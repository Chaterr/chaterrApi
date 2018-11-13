var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

const DiscountSchema = new Schema({
    discount_adjustments: {
        title: String,
        amount: String,
        coupon_id: {
            type: String,
            ref: 'Coupon'
        }
    }
}, {_id: false, versionKey: false});

var OrderSchema = new Schema({
    
    shop_id: {
        type: String,
        required: 'Kindly enter shop external id'
    },

    buyer_id: {
        type: String,
    },

    external_id: {
        type: String,
        unique: true
    },

    name: {
        type: String
    },

    order_number: {
        type: String,
    },

    created_at: {
        type: Date
    },

    updated_at: {
        type: Date
    },

    cancelled_at: {
        type: Date
    },

    cancel_reason: {
        type: String
    },

    closed_at: {
        type: Date
    },

    shipping_address: {
        type: Object
    },

    fulfillments: {
        type: []
    },

    line_items: {
        type: []
    },

    total_line_items_price: {
      type: String
    },

    fulfillment_status: {
        type: String
    },

    financial_status: {
        type: String
    },

    email: {
        type: String
    },

    phone: {
        type: String
    },

    payment_gateway_names: {
        type: []
    },

    currency: {
        type: String
    },

    total_tax: {
        type: String
    },

    subtotal_price: {
      type: String
    },

    shipping_lines: {
        type: []
    },

    total_price: {
        type: String
    },

    discount_adjustments: {
      type: [DiscountSchema]
    },

    order_status_url: {
        type: String,
        default: true
    },

    previous_order_id: {
        type: String
    }

}, { collection: 'orders', versionKey: false, toObject: { virtuals: true }});

OrderSchema.virtual('shop', {
    ref: 'Shop',
    localField: 'shop_id',
    foreignField: 'platform_shop_id',
    justOne: true
});

module.exports = mongoose.model('Order', OrderSchema);