require('isomorphic-fetch');
const express = require('express');
const router = express.Router();
var mongoose = require('mongoose');
var Shop = mongoose.model('Shop');
var Product = mongoose.model('Product');
var Order = mongoose.model('Order');
var Buyer = mongoose.model('Buyer');

router.get('/', async (req, res, next) => {
    let fields = req.query.fields ? req.query.fields.replace(/,/g," ") : '';
    let filter = JSON.parse(JSON.stringify({
        domain: req.query.domain,
        is_active: req.query.is_active,
        platform_plan: req.query.platform_plan
    }));

    let shops = await Shop.find(filter,"-_id").lean().select(fields).populate('settings','-_id').exec();
    await Promise.all(shops.map(async (shop) => {
        if(shop.platform_shop_id) {
            let orders = await Order.find({shop_id: shop.platform_shop_id}).exec();
            shop['orders_count'] = orders.length;
        }

        const reg = /-\s(.*)\splan/;
        if((shop.settings.recurring) && (shop.settings.recurring.length > 0) && (shop.settings.recurring[0].status === 'active')) {
            let match = shop.settings.recurring[0].name.match(reg)[1];
            shop['sally_plan'] = match;
        }

        delete shop['settings'];
    }));

    res.json({count: shops.length, shops: shops});
});

router.get('/delete', (req, res, next) => {
    Shop.remove({}, ()=>{
        res.send('ok');
    });
});

router.delete('/:shopid', (req, res, next) => {
    let shop_id = req.params.shopid;
    Order.remove({shop_id: shop_id}, (err)=>{});
    Product.remove({shop_id: shop_id}, (err)=>{});
    Buyer.remove({shop_id: shop_id}, (err)=>{});
    Shop.remove({platform_shop_id: shop_id}, (err)=>{});
});

router.get('/:shopid/products', (req, res, next) => {
    if(req.query.limit) {
        // console.log(`Limit of ${req.query.limit} products`);
        Product.find({shop_id: req.params.shopid})
        .limit(+req.query.limit)
        .exec((err, products) => res.json(products));
    } else {
        Product.find({shop_id: req.params.shopid})
        // .populate('shop', ['platform_shop_id'])
        .exec((err, products) => res.json(products));
    }
});

router.get('/:shop_domain', (req, res, next) => {

    let fields = req.query.settings_fields ? req.query.settings_fields.replace(/,/g," ") : '';
    const shop_domain = req.params.shop_domain;

    Shop.findOne({domain: shop_domain}).populate('settings',`${fields} -_id`).lean().exec((err, shop) => {
        res.json(shop);
    });
});

router.get('/:shopDomain/orders', (req, res, next) => {
    // console.log(req.params.shopDomain);
    const shop_domain = req.params.shopDomain;

    Shop.findOne({domain: shop_domain}).exec((err, shop) => {
        if(!shop) {
            res.json([]);
        } else {
            res.redirect(`http://${req.headers.host}/orders/${shop.platform_shop_id}`);
        }
    });
});

router.get('/:shopDomain/status', (req, res, next) => {
    const shop_domain = req.params.shopDomain;

    Shop.findOne({domain: shop_domain}).exec((err, shop) => {
        if(!shop) {
            res.json({first_install: true});
        } else {
            res.json({is_active: shop.is_active, first_install: false});
        }
    });
});

router.get('/:shopDomain/plan', (req, res, next) => {

    const shop_domain = req.params.shopDomain;
    const plan = req.query.plan;

    // console.log(shop_domain, req.query.plan);

    res.json({message: 'OK'});

    Shop.findOneAndUpdate({domain: shop_domain}, {plan: plan}).exec((err) => {
        if(err) {
            res.json(err);
        }
    });
});

router.post('/:shopDomain/application_plan_charge', (req, res) => {
    const shop_domain = req.params.shopDomain;
    const recurring_application_charge = req.body;
    res.json({message: 'application_plan_charge: OK'});
    Shop.findOneAndUpdate({domain: shop_domain}, recurring_application_charge).exec((err) => {
        if(err) {
            res.json(err);
        }
    });
});

router.post('/update-all', (req, res) => {
    const data = req.body;
    Shop.update({}, data, {multi: true}).exec((err, doc) => {
        if(err) {
            res.json(err);
        } else {
            res.json(doc);
        }
    });
});

router.post('/delete-fields-all', (req, res) => {
    const data = req.body;
    Shop.update({}, {$unset: data}, {multi: true}).exec((err, doc) => {
        if(err) {
            res.json(err);
        } else {
            res.json(doc);
        }
    });
});


module.exports = router;