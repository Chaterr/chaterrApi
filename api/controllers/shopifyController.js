const mongoose = require('mongoose');

const Shop = mongoose.model('Shop');
const Product = mongoose.model('Product');
const Order = mongoose.model('Order');
const Buyer = mongoose.model('Buyer');
const User = mongoose.model('User');

let Shopify = require('shopify-prime');

exports.register_orders = async function(req, res) {
    const {auth, shop} = req.body;
    console.log(shop);
    try {
        const orderService = new Shopify.Orders(shop, auth.token);
        let limit = 250;
        let ordersList = [];
        let count = await orderService.count({status: "any"});
        let pages = Math.ceil((count/limit));
        for(let i = 1; i <= pages ; i++) {
            let orders = await orderService.list({status: "any", limit: limit, page: i});
            console.log(`page ${i}: ${orders.length} orders`);
            ordersList = ordersList.concat(orders);
            // ordersList = [...ordersList, orders];
        }

        res.json({
            pages: pages,
            orders_count: count,
            orders_length: ordersList.length,
            orders: ordersList
        });
    } catch (e) {
        console.log(e.message);
        res.status(404).send(e.message);
    }
};