const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let CollectionSchema = new Schema({
    id: Number,
    handle: String,
    title: String,
    updated_at: String,
    body_html: String,
    published_at: String,
    sort_order: String,
    template_suffix: String,
    products_count: Number,
    published_scope: String,
    admin_graphql_api_id: String,
    image: Object
}, {_id: false});

let HotDealsSchema = new Schema({
    sally_collection: {
        type: CollectionSchema,
        default: null
    },

    products: {
        type: [],
        default: []
    }

}, {_id: false});

module.exports = HotDealsSchema;