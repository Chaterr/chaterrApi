const express = require('express');
const router = express.Router();
var mongoose = require('mongoose');
var Product = mongoose.model('Product');

router.get('/', (req, res, next) => {
    let limit = +req.query.limit;
    let filter = JSON.parse(JSON.stringify({
        external_id: req.query.product_id
    }));


    Product.findOne(filter).limit(limit).exec((err, product) => {
        if(!product) {
            res.status(404).send();
        }

        res.json(product);
    });
});


router.get('/:shopid', (req, res, next) => {
    if(req.query.limit) {
        // console.log(`Limit of ${req.query.limit} products`);
        Product.find({shop_id: req.params.shopid})
        .limit(+req.query.limit)
        .exec((err, products) => res.json(products));
    } else {
        Product.find({shop_id: req.params.shopid})
        .exec((err, products) => res.json(products));
    }
});

module.exports = router;