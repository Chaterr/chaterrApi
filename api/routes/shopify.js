require('es6-promise').polyfill();
require('isomorphic-fetch');
require('dotenv').config();
const express = require('express');
const router = express.Router();
var mongoose = require('mongoose');
var Shop = mongoose.model('Shop');
var Product = mongoose.model('Product');
var Order = mongoose.model('Order');
var Buyer = mongoose.model('Buyer');
var Settings = mongoose.model('Settings');

const {
    GATEWAY_URL
} = process.env;


let createWebhooks = (shop, auth, apiDomain) => {

    const webhooksPath = `https://${apiDomain}/shopify/webhooks`;

    //Shop Webhooks
    let au = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'app/uninstalled',
            address: `${webhooksPath}/shop-uninstalled`,
            format: 'json'
        }
    })).then(id => id);

    let su = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'shop/update',
            address: `${webhooksPath}/shop-update`,
            format: 'json'
        }
    })).then(id => id);

    //Products Webhooks
    let pc = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'products/create',
            address: `${webhooksPath}/product-create`,
            format: 'json'
        }
    })).then(id => id);

    let pd = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'products/delete',
            address: `${webhooksPath}/product-delete`,
            format: 'json'
        }
    })).then(id => id);

    let pu = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'products/update',
            address: `${webhooksPath}/product-update`,
            format: 'json'
        }
    })).then(id => id);

    //Orders webhooks
    let oc = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'orders/create',
            address: `${webhooksPath}/order-create`,
            format: 'json'
        }
    })).then(id => id);

    let od = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'orders/delete',
            address: `${webhooksPath}/order-delete`,
            format: 'json'
        }
    })).then(id => id);

    let ou = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'orders/updated',
            address: `${webhooksPath}/order-updated`,
            format: 'json'
        }
    })).then(id => id);

    let oca = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'orders/cancelled',
            address: `${webhooksPath}/order-cancelled`,
            format: 'json'
        }
    })).then(id => id);

    let of = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'orders/fulfilled',
            address: `${webhooksPath}/order-fulfilled`,
            format: 'json'
        }
    })).then(id => id);

    let ofq = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'orders/fulfilled',
            address: GATEWAY_URL,
            format: 'json'
        }
    })).then(id => id);

    // New from Tomer
    let ocq = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'orders/create',
            address: GATEWAY_URL,
            format: 'json'
        }
    })).then(id => id);
    //Buyer Webhooks

    let bd = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'customers/delete',
            address: `${webhooksPath}/customers-delete`,
            format: 'json'
        }
    })).then(id => id);

    let bu = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'customers/update',
            address: `${webhooksPath}/customers-update`,
            format: 'json'
        }
    })).then(id => id);

    let bc = registerWebhook(shop, auth.token, auth.hmac, JSON.stringify({
        webhook: {
            topic: 'customers/create',
            address: `${webhooksPath}/customers-create`,
            format: 'json'
        }
    })).then(id => id);

    return Promise.all([au,su,pc,pd,pu,oc,od,ou,oca,of,ofq,ocq, bd,bu,bc]).then((values) => {
        return values.filter(id => id);
    });
};

const registerWebhook = function(shopDomain, accessToken, hmac,  webhook) {
    return fetch(`https://${shopDomain}/admin/webhooks.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
            'X-Shopify-Topic': webhook.topic,
            'X-Shopify-Hmac-Sha256': hmac,
            'X-Shopify-Shop-Domain': shopDomain
        },
        body: webhook
    })
        .then((response => response.json()))
        .then(response => {
            if (response.error) {
                throw response.error
            } else {
                return response.webhook.id;
            }
        })
        .catch(error => {});
};

router.post('/register', (req, res, next) => {

    const {auth, shop} = req.body;
    const ecommercePlatform = 'shopify';
    let isNewShop = false;

    // console.log(auth, shop);

    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': auth.token
        },
        credentials: 'include',
    };

    var shopInfo = fetch(`https://${shop}/admin/shop.json`, options)
        .then((response => response.json()))
        .then(retShop => {
            var shop = retShop.shop;

            shop.company = 'AFTER_SALE';
            shop.project = 'SALLY_BOT';
            shop.is_active = true;
            shop.platform_shop_id = shop['id'];
            shop.title = shop['name'];
            shop.support_email = shop['customer_email'];
            shop.platform_plan = shop['plan_name'];
            shop.owner_email = shop['email'];
            shop.owner_name = shop['shop_owner'];
            shop.ecommercePlatform = ecommercePlatform;
            shop.auth = auth;
            shop.domain = shop['myshopify_domain'];

            return shop;
        })
        .catch(error => console.error('shop exists'));


    var products = fetch(`https://${shop}/admin/products.json?limit=250`, options)
        .then((response => response.json()))
        .then(products => {
            products.products.forEach(product => {

                product.external_id = product['id'];
                product.description = product['metafields_global_description_tag'];
                product.image_url = product.images.length ? product.images[0].src : '';

            });

            return products.products;
        })
        .catch(error => console.error('Error:', error));

    var orders = fetch(`https://${shop}/admin/orders.json?limit=250&status=any`, options)
        .then(response =>  response.json())
        .then(orders => {
            orders.orders.forEach(order => {
                order.external_id = order['id'];
                if(order.customer) {
                    order.buyer_id = order.customer['id'];
                }
            });

            // console.log(orders.orders);
            return orders.orders;
        })
        .catch(error => console.error('Error:', error));

    const buyers = fetch(`https://${shop}/admin/customers.json`, options)
        .then((response => response.json()))
        .then(buyers => {
            buyers.customers.forEach(buyer => {
                buyer.external_id = buyer['id'];
                buyer.user_email = buyer['email'];
                buyer.user_phone = buyer['phone']
            });

            // console.log("buyers: ", buyers);
            return buyers.customers;
        })
        .catch(error => console.error('Error:', error));

    var combinedData = {
        shopInfo: {},
        products: {},
        orders: {},
        buyers: {}
    };

    Promise.all([shopInfo,products,orders,buyers]).then((values) => {

        combinedData["shopInfo"] = values[0];
        combinedData["products"] = values[1];
        combinedData["orders"] = values[2];
        combinedData["buyers"] = values[3];

        // console.log("Orders: ", combinedData["orders"]);

        Shop.findOneAndUpdate({platform_shop_id: combinedData.shopInfo.platform_shop_id},
            combinedData.shopInfo, {upsert: true, setDefaultsOnInsert: true, rawResult: true, new: true}, (err, newShop) => {
                // console.log(newShop);
                // if(!newShop.lastErrorObject.updatedExisting) {
                let mes = newShop.lastErrorObject.updatedExisting ? 'Updated' : 'Added';
                isNewShop = !newShop.lastErrorObject.updatedExisting;
                newShop = newShop.value;

                console.log(`${mes} new shop: ${newShop.title}`);
                createWebhooks(shop, auth, req.headers.host)
                    .then(webhooks => {
                        if (webhooks.length > 0) {
                            newShop.update({webhooks: webhooks}, (err) => {
                                if (err)
                                    console.log(err)
                            });
                        }
                    });

                Settings.findOneAndUpdate({shop_domain: newShop.domain}, {shop_domain: newShop.domain}, {upsert: true, setDefaultsOnInsert: true, new: true, rawResult: true}, (err, settings) => {
                    if(err) {
                        console.log(err);
                    } else {
                        if(!settings.lastErrorObject.updatedExisting) {
                            settings = settings.value;
                            settings.agent.email = newShop.support_email;
                            settings.shop_plan = newShop.platform_plan;
                            settings.save();
                        }
                    }
                });

                combinedData.products.map(product => {product.shop_id = newShop.platform_shop_id});
                combinedData.orders.map(order => {order.shop_id = newShop.platform_shop_id});
                combinedData.buyers.map(buyer => {buyer.shop_id = newShop.platform_shop_id});

                Product.insertMany(combinedData.products, (err) => {if(err) console.log(err.code)});
                Order.insertMany(combinedData.orders, (err) => {if(err) console.log(err.code)});
                Buyer.insertMany(combinedData.buyers, (err) => {if(err) console.log(err.code)});
            });

        res.json({
            is_new_shop: isNewShop
        });
    });
});

function getDiscountTypeObj(discount_type, data) {
    let retObj = null;

    switch (discount_type) {
        case "free_shipping":
            retObj = {
                price_rule: {
                    title: "SALLYFREESHIPPING",
                    target_type: "shipping_line",
                    target_selection: "all",
                    allocation_method: "each",
                    value: -100,
                    value_type: "percentage",
                    customer_selection: "all",
                    starts_at: new Date()
                },
                discount_code: {
                    code: "SALLYFREESHIPPING"
                }
            };
            break;
        case "percentage":
            retObj = {
                price_rule: {
                    title: "SALLYPERCENTAGE",
                    target_type: "line_item",
                    target_selection: "all",
                    allocation_method: "across",
                    value_type: "percentage",
                    value: data.value,
                    customer_selection: "all",
                    starts_at: new Date()
                },
                discount_code: {
                    code: "SALLYPERCENTAGE"
                }
            };
            break;
        default:
            retObj = null;
    }

    return retObj;
}

router.post('/createDiscount', async (req, res) => {
    const {token, shop, discount_type, discount_data} = req.body;
    console.log(discount_type, discount_data);
    const obj = getDiscountTypeObj(discount_type, discount_data);

    let rule = {price_rule: obj.price_rule};
    let discount = {discount_code: obj.discount_code};

    console.log(rule, discount);

    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token
        },
        credentials: 'include',
        body: JSON.stringify(rule)
    };

    console.log(`https://${shop}/admin/discount_codes/lookup.json?code=${rule.title}`);
    let isDiscountExists = await fetch(`https://${shop}/admin/discount_codes/lookup.json?code=${rule.title}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token
        },
        credentials: 'include'}
    ).then((response) => response.json());

    let settings = await Settings.findOne({shop_domain: shop}).exec();

    console.log(isDiscountExists);
    if(!isDiscountExists.errors) {
        settings.discount[discount_type].id = '';
        settings.discount[discount_type].graphId = '';
        settings.save().then((set) => res.json({discount: set.discount})).catch((err) => console.log(err));

    } else {
        try {
            console.log("gonna create discount!", `https://${shop}/admin/price_rules.json`);
            let data = await fetch(`https://${shop}/admin/price_rules.json`, options)
                .then((response) => response.json())
                .then((data) => data.price_rule);

            console.log("data is: ", data);

            if(data) {
                settings.discount[discount_type.toString()].id = data.id;
                settings.discount[discount_type.toString()].graphId = data.admin_graphql_api_id;

                settings.save();
                options.body = JSON.stringify(discount);
                let discountCode = await fetch(`https://${shop}/admin/price_rules/${+data.id}/discount_codes.json`, options)
                    .then((response) => response.json())
                    .catch((err) => console.log(err));

                res.json({discount: settings.discount});
            } else {
                throw "data not available"
            }
        } catch (e) {
            console.log("caught: ", e);
            res.status(404).send();
        }
    }
});

router.post('/update/orders', (req, res) => {
    const {token, shop, shop_external_id} = req.body;

    // console.log("Update orders for shop ID: ", shop_external_id);
    Order.remove({shop_id: shop_external_id}, ()=>{});

    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': token
        },
        credentials: 'include',
    };

    fetch(`https://${shop}/admin/orders.json?limit=250&status=any`, options)
        .then(response =>  response.json())
        .then(orders => {
            orders.orders.forEach(order => {
                order.external_id = order['id'];
                order.shop_id = shop_external_id;
                if(order.customer) {
                    order.buyer_id = order.customer['id'];
                }
            });

            // console.log(orders.orders[0]);
            return orders.orders;
        })
        .then(ordersList => {
            Order.insertMany(ordersList, (err, docs) => {
                if (!err) {
                    res.json(docs);
                } else {
                    res.send(err);
                }
            });
        })
        .catch(error => console.error('Error:', error));
});

router.get('/deleteAll', (req, res, next) => {

    Shop.remove({}, ()=>{});
    Order.remove({}, ()=>{});
    Product.remove({}, ()=>{});
    Buyer.remove({}, ()=>{});

    res.json({
        message: 'Deleted tables: shops, orders. products and buyer'
    });
});

module.exports = router;