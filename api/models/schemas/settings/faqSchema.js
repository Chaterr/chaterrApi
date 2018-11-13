const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const default_questions = [
    {
        id: 1,
        question: 'Where are you based?',
        answer: '',
        nlp_flag: 'faq_2_store_location',
        group: 1
    },

    {
        id: 2,
        question: 'What brands do you work with?',
        answer: '',
        nlp_flag: 'faq_3_brand_list',
        group: 1
    },

    {
        id: 3,
        question: 'What is the store\'s phone number?',
        answer: '',
        nlp_flag: 'faq_17_shop_phone_number',
        group: 1
    },

    {
        id: 4,
        question: 'What is expected time for live agent reply?',
        answer: '',
        nlp_flag: 'faq_18_time_for_agent_replay',
        group: 1
    },

    {
        id: 5,
        question: 'Can I pay in cash?',
        answer: '',
        nlp_flag: 'faq_4_pay_cash',
        group: 2
    },

    {
        id: 6,
        question: 'What are your payment methods?',
        answer: '',
        nlp_flag: 'faq_6_payment_methods',
        group: 2
    },

    {
        id: 7,
        question: 'Why my order is taking so long?',
        answer: '',
        nlp_flag: 'faq_16_long_time',
        group: 3
    },
    {
        id: 8,
        question: 'Where do you deliver?',
        answer: '',
        nlp_flag: 'faq_7_deliver_target',
        group: 3
    },

    {
        id: 9,
        question: 'How long does delivery take?',
        answer: '',
        nlp_flag: 'faq_8_delivery_time',
        group: 3
    },

    {
        id: 10,
        question: 'Can I cancel my order?',
        answer: '',
        nlp_flag: 'faq_11_cancel_order',
        group: 4
    },

    {
        id: 11,
        question: 'Can I consult someone from your company?',
        answer: '',
        nlp_flag: 'faq_14_consult_someone',
        group: 4
    },
];

let askQuestionsSchema = new Schema({
    id: {
        type: Number,
        default: 0
    },

    status: {
        type: Boolean,
        default: false
    },

    question: {
        type: String,
        default: ''
    },

    answer: {
        type: String,
        default:''
    },

    nlp_flag: {
        type: String,
        default:''
    },

    group: {
        type: Number,
        default: 0
    }
}, {_id: false});

let FaqSchema = new Schema({

    questions: {
        type: [askQuestionsSchema],
        default: default_questions
    }

}, {_id: false});

module.exports = FaqSchema;