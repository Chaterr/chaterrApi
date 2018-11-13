const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Email
// Facebook Messenger inbox - Pro
// Helpy.io - Pro
// Zendesk - Pro
// Live person - Premium
//
// let IntegrationSchema = new Schema({
//
//     basic: {
//         type: String,
//         enum: ['email'],
//         default: 'email'
//     },
//
//     pro: {
//         type: String,
//         enum: ['email', 'messenger', 'helpy', 'zendesk'],
//         default: 'email'
//     },
//
//     premium: {
//         type: String,
//         enum: ['email', 'messenger', 'helpy', 'zendesk', 'live'],
//         default: 'email'
//     }
// }, {_id: false});

let AgentEscalationSchema = new Schema({
    email: {
        type: String,
        default: " "
    },

    integration: {
        type: String,
        enum: ['email', 'messenger', 'helpy', 'zendesk', 'live'],
        default: 'email'
    }
}, {_id: false});

module.exports = AgentEscalationSchema;