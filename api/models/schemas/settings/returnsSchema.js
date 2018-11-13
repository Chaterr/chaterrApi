const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let TermsSchema = new Schema({
    first_para: {
        type: String,
        default: ""
    },
    second_para: {
        type: String,
        default: ""
    },
    third_para: {
        type: String,
        default: ""
    },
    doc_url: {
        type: String,
        default: ""
    },
}, {_id: false});

let AgentEscalationSchema = new Schema({
    first_question: {
        type: String,
        default: ""
    },
    second_question: {
        type: String,
        default: ""
    },
    third_question: {
        type: String,
        default: ""
    },
    request_photo: {
        type: Boolean,
        default: false
    },
    request_email: {
        type: Boolean,
        default: false
    },
    request_phone: {
        type: Boolean,
        default: false
    }
}, {_id: false});

let ReturnsSchema = new Schema({
    terms: {
        type: TermsSchema,
        default: true
    },

    agent: {
        type: AgentEscalationSchema,
        default: true
    }
}, {_id: false});

module.exports = ReturnsSchema;