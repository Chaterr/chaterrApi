const mongoose = require('mongoose');

const Shop = mongoose.model('Shop');
const Product = mongoose.model('Product');
const Order = mongoose.model('Order');
const Buyer = mongoose.model('Buyer');
const User = mongoose.model('User');

let Shopify = require('shopify-prime');

// //POST
// /*
//     method: POST
//     Body:
//     {
//         orders_count: 100
//     }
//
//  */
// exports.days_to_sell_x_orders = async function(req, res) {
//     const {orders_count} = req.body;
//         const shopList = await Shop.find({}).exec();
//         let statisticsList = [];
//
//         let all = await shopList.map(async (shop) => {
//             // console.log(shop.is_active, shop.domain);
//             console.log("before: ", shop.domain, shop.auth.token, shop.is_active);
//             if(shop.is_active) {
//                 const orderService = new Shopify.Orders(shop.domain, shop.auth.token);
//                 console.log("after: ", shop.domain, shop.auth.token, shop.is_active);
//                 // console.log("after: ", shop.domain);
//
//                 let limit = orders_count;
//                 let ordersList = [];
//                 let pages = 1;
//                 if(orders_count > 250 ) {
//                     pages = Math.ceil((orders_count/250));
//                 }
//
//                 for(let i = 1; i <= pages ; i++) {
//                     let orders = await orderService.list({status: "any", limit: limit, page: i});
//                     console.log(`page ${i}: ${orders.length} orders`);
//                     ordersList = ordersList.concat(orders);
//                     // ordersList = [...ordersList, orders];
//                 }
//
//                 ordersList.sort((a, b) => ((a.id) > (b.id)) ? 1 : ((a.id) < (b.id)) ? -1 : 0);
//                 let orders_price_avg = 0;
//                 ordersList.forEach((or) => {
//                     orders_price_avg += (+or.total_price);
//                 });
//
//                 orders_price_avg = orders_price_avg / orders_count;
//                 var one_day=1000*60*60*24;
//                 let first = new Date(ordersList[0].created_at).getTime();
//                 let last = new Date(ordersList[ordersList.length-1].created_at).getTime();
//                 let days = Math.round((last-first)/one_day);
//
//                 // console.log('days: ', days);
//
//                 // console.log("adding: ", setup);
//
//                 let setup = {
//                     shop: shop.domain,
//                     orders_length: ordersList.length,
//                     days: days,
//                     price_avg: orders_price_avg
//                 };
//
//                 statisticsList.push(setup);
//
//             }
//
//         });
//
//         await Promise.all(all).then((getAll) => console.log('GET ALL: ', getAll));
//
//         console.log("ALL: ", all);
//         console.log("statistics List: ", statisticsList);
// };




//POST
/*
    method: POST
    Body:
    {
        orders_count: 100
    }

 */
exports.days_to_sell_x_orders = async function(req, res) {
    const {shop, orders_count} = req.body;
    console.log(shop);
    try {
        const orderService = new Shopify.Orders(shop.domain, shop.token);
        let limit = orders_count;
        let ordersList = [];
        let count = await orderService.count({status: "any"});
        let pages = 1;
        if(orders_count > 250 ) {
            pages = Math.ceil((orders_count/250));
        }

        for (let i = 1; i <= pages ; i++) {
            let orders = await orderService.list({status: "any", limit: limit, page: i});
            console.log(`page ${i}: ${orders.length} orders`);
            ordersList = ordersList.concat(orders);
            // ordersList = [...ordersList, orders];
        }

        ordersList.sort((a, b) => ((a.id) > (b.id)) ? 1 : ((a.id) < (b.id)) ? -1 : 0);
        let orders_price_avg = 0;
        ordersList.forEach((or) => {
            orders_price_avg += (+or.total_price);
        });

        orders_price_avg = orders_price_avg / orders_count;
        var one_day=1000*60*60*24;
        let first = new Date(ordersList[0].created_at).getTime();
        let last = new Date(ordersList[ordersList.length-1].created_at).getTime();
        let days = Math.round((last-first)/one_day);

        let setup = {
            shop: shop.domain,
            orders_count: count,
            orders_length: ordersList.length,
            days: days,
            price_avg: orders_price_avg
        };

        res.json(setup);
    } catch (e) {
        console.log(e);
        res.status(404).send(e.message);
    }
};

