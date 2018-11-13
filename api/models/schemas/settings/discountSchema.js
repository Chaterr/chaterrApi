const mongoose = require('mongoose');
const Schema = mongoose.Schema;


let defaultObj = new Schema({
    id: {
        type: String,
        default: ''
    },

    graphId: {
        type: String,
        default: ''
    }
}, {_id: false});

let DiscountSchema = new Schema({
    free_shipping: {
        type: defaultObj,
        default: true
    },

    percentage: {
        type: defaultObj,
        default: true
    },

    buy_x_get_y: {
        type: defaultObj,
        default: true
    },

    fixed: {
        type: defaultObj,
        default: true
    }
}, {_id: false});

module.exports = DiscountSchema;