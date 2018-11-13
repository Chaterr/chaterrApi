require('isomorphic-fetch');
const express = require('express');
const router = express.Router();
let mongoose = require('mongoose');
let Order = mongoose.model('Order');
let Controller = require('../controllers/shopifyStatistics');

router.get('/', (req, res, next) => {
    let filter = JSON.parse(JSON.stringify({
        external_id: req.query.order_id,
    }));

    let fields = req.query.fields ? req.query.fields.replace(/,/g," ") : '';

    Order.find(filter, {'_id':0}).select(fields).lean().populate('shop').exec(function(error, orders) {
        res.json({count: orders.length, orders: orders});
    });
});

router.get('/:shopid', (req, res, next) => {
    let fields = req.query.fields ? req.query.fields.replace(/,/g," ") : '';
    Order.find({shop_id: req.params.shopid}, {'_id':0}).select(fields).lean().exec(function (error, orders) {
        orders.sort((a, b) => ((+a.order_number) > (+b.order_number)) ? 1 : ((+a.order_number) < (+b.order_number)) ? -1 : 0);
        res.json({count: orders.length, orders: orders});
    });
});

router.post('/statistics/days_between_orders', Controller.days_to_sell_x_orders);

module.exports = router;