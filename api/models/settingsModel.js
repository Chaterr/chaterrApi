const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const NotificationSchema = require('./schemas/settings/notificationSchema');
const AgentSchema = require('./schemas/settings/agentEscalationSchema');
const FeedbackSchema = require('./schemas/settings/feedbackSchema');
const ReturnsSchema = require('./schemas/settings/returnsSchema');
const FAQSchema = require('./schemas/settings/faqSchema');
const RecurringSchema = require('./schemas/settings/recurringSchema');
const DiscountSchema = require('./schemas/settings/discountSchema');
const HotDealsSchema = require('./schemas/settings/hotDealsSchema');

let SettingsSchema = new Schema({
    shop_domain: {
        type: String,
        unique: true,
    },

    shop_plan: {
        type: String,
    },

    recurring: {
        type: [RecurringSchema],
        default: []
    },

    notifications: {
        type: NotificationSchema,
        default: true
    },

    agent: {
        type: AgentSchema,
        default: true
    },

    feedback: {
        type: FeedbackSchema,
        default: true
    },

    returns: {
      type: ReturnsSchema,
      default: true
    },

    faq: {
      type: FAQSchema,
      default: true
    },

    discount: {
        type: DiscountSchema,
        default: true
    },

    deals: {
      type: HotDealsSchema,
      default: true
    }

}, { collection: 'settings', id: false, versionKey: false, toJSON: { virtuals: true }});

SettingsSchema.virtual('trial_days_left').get(function() {

    let days = 14;
    let index = 0;

    while (this.recurring && this.recurring[index]) {
        if(this.recurring[index].activated_on) {
            let trial_ends_on = new Date(this.recurring[index].trial_ends_on);
            let activated_on = new Date(this.recurring[index].activated_on);


            if(this.recurring[index].cancelled_on) {
                let cancelledDate =  this.recurring[index].cancelled_on;
                if ((cancelledDate <= trial_ends_on) && (cancelledDate >= activated_on)) {
                    days = Math.ceil((trial_ends_on - cancelledDate) / (1000 * 60 * 60 * 24));
                }

            } else {

                let now = Date.now();

                if ((now <= trial_ends_on) && (now >= activated_on)) {
                    days = Math.ceil((trial_ends_on - now) / (1000 * 60 * 60 * 24));
                }
            }

            break;
        }

        index++;
    }

    return days;
});

SettingsSchema.virtual('plan_name').get(function () {
    const reg = /-\s(.*)\splan/;
    if((this.recurring) && (this.recurring.length > 0) && (this.recurring[0].status === 'active')) {
        let match = this.recurring[0].name.match(reg)[1];
        return match;
    } else {
        return '';
    }
});

module.exports = mongoose.model('Settings', SettingsSchema);