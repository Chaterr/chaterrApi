require('isomorphic-fetch');
const express = require('express');
const router = express.Router();
var mongoose = require('mongoose');
var Settings = mongoose.model('Settings');
var Shop = mongoose.model('Shop');
let PriceHandler = require("../handlers/priceRuleHandler");

router.get('/', (req, res) => {
    let fields = req.query.fields ? req.query.fields.replace(/,/g," ") : '';
    Settings.find({}).select(fields).exec(function(error, settings) {
        res.json(settings);
    });
});

router.get('/:shopDomain', async (req, res, next) => {
    let shop_domain = req.params.shopDomain;
    let fields = req.query.fields ? req.query.fields.replace(/,/g," ") : '';

    // console.log("settings for shop: ", shop_domain);
    try {
        Settings.findOne({shop_domain: shop_domain}).select(fields).exec(async function (error, settings) {
            // console.log("settings : ", settings.discount);
            let shop = await Shop.findOne({domain: shop_domain}).exec();
            let priceRuleHandler = new PriceHandler.priceRuleHandler(shop_domain, shop.auth.token);

            if(settings.discount) {
                let changed = false;
                let freeShipExist = await priceRuleHandler.isDiscountCodeExists(PriceHandler.code.SALLYFREESHIPPING);
                if(settings.discount.free_shipping.id && !freeShipExist) {
                    settings.discount.free_shipping.id = '';
                    settings.discount.free_shipping.graphId = '';
                    changed = true;
                }

                let perExist = await priceRuleHandler.isDiscountCodeExists(PriceHandler.code.SALLYPERCENTAGE);
                if(settings.discount.percentage.id && !perExist) {
                    settings.discount.percentage.id = '';
                    settings.discount.percentage.graphId = '';
                    changed = true;
                }

                if (changed) {
                    // console.log("settings changed!");
                    settings.save();
                    console.log(settings);
                }
            }

            res.json(settings);
        });
    } catch (e) {
        console.log(e);
        res.status(404).send(e.message);
    }
});

router.post('/:shopDomain', (req, res, next) => {
    const options = { upsert: true, setDefaultsOnInsert: true };
    const setting = req.body;

    Settings.findOneAndUpdate({shop_domain: req.params.shopDomain}, setting, options, (err, settings) => {
        if(err) {
            res.status(409).send(err.message);
        } else {
            // console.log(settings);
            res.status(200).json(settings);
        }
    });
});

router.post('/:shopDomain/plan', (req, res) => {
    const setting = req.body;

    Settings.findOne({shop_domain: req.params.shopDomain}).exec((err, settings) => {
        let index = settings.recurring.findIndex((rec) => rec.id == setting.id);
        if(index != (-1)) {
            settings.recurring[index] = setting;
        } else {
            if(settings.recurring.length > 0) {
                settings.recurring[0].status = "cancelled";
                settings.recurring[0].cancelled_on = Date.now();
            }

            settings.recurring.unshift(setting);
        }

        settings.update(settings, (err) => console.log(err));
        res.status(200).json(settings);
    });
});

/*
{
	"question_id": 3,
	"question_old_value": "Can I pay in chash?"
	"question_value": "Can I pay in cash?",
}
 */
router.post('/faq/:question_id/update-all', (req, res) => {
    const data = req.body;
    const question_id = req.params.question_id;
    // console.log(question_id);
    Settings.find({}).exec(function(err, settings) {
        if(err) {
            res.json(err);
        } else {
            settings.forEach((set, i) => {
                if(set.faq.questions[question_id].question === data.question_old_value) {

                    set.faq.questions[question_id].question = data.question_value;
                    set.save();
                }
                // console.log(set.faq.questions[question_id].question);
            });

            res.send("Updated successfully");
        }
    });
});

/*
{
    question: ''
}
 */
router.post('/faq/delete', (req, res) => {
    const data = req.body;
    console.log(data);

    Settings.find({}).exec(function(err, settings) {
        if(err) {
            res.json(err);
        } else {
            settings.forEach((set, i) => {
                try{
                    let question_id = set.faq.questions.findIndex((q) => q.question === data.question);
                    if(question_id !== (-1)) {
                        // console.log("id: ", question_id);
                        set.faq.questions.splice(question_id, 1);
                        set.save();
                    }
                } catch (e) {
                    console.log(e);
                }


                // console.log(set.faq.questions[question_id].question);
            });

            res.send("Updated successfully");
        }
    });
});

/*

 */
router.post('/faq/update', async (req, res) => {
    const data = req.body;
    let filter = JSON.parse(JSON.stringify({
        shop_domain: req.query.shop_domain,
    }));

    console.log(data);
    try {
        let settings = await Settings.find(filter).exec();
        if(settings) {
            settings.forEach((set, i) => {
                let question_id = set.faq.questions.findIndex((q) => q.question === data.current.question);
                if(question_id !== (-1)) {
                    set.faq.questions[question_id] = Object.assign(set.faq.questions[question_id], data.new);
                    set.faq.questions.sort((a, b) => ((+a.id) > (+b.id)) ? 1 : ((+a.id) < (+b.id)) ? -1 : 0);
                    set.save();
                }
            });

            res.send("Updated successfully");
        } else {
            res.json("Can't get settings from DB");
        }

    } catch (e) {
        console.log(e);
        res.status(404).send(e.message);
    }
});

router.post('/faq/new', (req, res) => {
    const data = req.body;
    // console.log(data);

    Settings.find({}).exec(function(err, settings) {
        if(err) {
            res.json(err);
        } else {
            settings.forEach((set, i) => {
                try{
                    set.faq.questions.push(data);
                    set.faq.questions.sort((a, b) => ((+a.id) > (+b.id)) ? 1 : ((+a.id) < (+b.id)) ? -1 : 0);
                    set.save();
                } catch (e) {
                    console.log(e);
                    res.status(404).send(e.message);
                }
            });

            res.send("Updated successfully");
        }
    });
});

router.get('/deals/delete/:shop_domain', (req, res) => {
    let shop_domain = req.params.shop_domain;

    Settings.findOne({shop_domain: shop_domain}).exec(function(err, settings) {
        if(settings) {
            settings.deals.products = [];
            settings.deals.sally_collection = null;
            settings.save();
            res.send(settings);
        } else {
            res.status(404).send();
        }
    });
});

module.exports = router;