const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

let variantSchema = new Schema({ id: 'String', title: 'String', price: 'String' }, {_id: false});

let ProductSchema = new Schema({
    
    shop_id: {
        type: String,
        required: 'Kindly enter shop ID'
    },

    external_id: {
        type: String,
        unique: true,
        required: 'Kindly enter product external ID'
    }, 

    product_type: String,

    title: {
        type: String,
        required: 'Kindly enter shop name'
    }, 

    description: String,

    image_url: {
        type: String,
        // required: 'Kindly enter image URL'
    }, 

    variants: [variantSchema],

    vendor: String,

    hotDeal: { type: ObjectId, ref: 'HotDeal' }

}, { collection: 'products', versionKey: false, toJSON: { virtuals: true }});


ProductSchema.virtual('shop', {
    ref: 'Shop',
    localField: 'shop_id', 
    foreignField: 'platform_shop_id',
    justOne: true
}, {_id: false});
  
module.exports = mongoose.model('Product', ProductSchema);