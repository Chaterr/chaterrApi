const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;


let UserSchema = new Schema({

    fbid: {
        type: String,
        unique: true,
        required: 'Kindly enter FBID'
    },

    buyer_id: {
        type: String
    },

    memUser: {
        type: String,
        default: ""
    },

    memPerm: {
        type: String,
        default: ""
    },

    memTemp: {
        type: String,
        default: ""
    },

    company: String,
    project: String
}, { collection: 'users', versionKey: false});

module.exports = mongoose.model('User', UserSchema);