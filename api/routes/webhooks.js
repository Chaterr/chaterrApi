require('es6-promise').polyfill();
require('isomorphic-fetch');
const express = require('express');
const router = express.Router();
var mongoose = require('mongoose');
var Shop = mongoose.model('Shop');
var Settings = mongoose.model('Settings');
var Product = mongoose.model('Product');
var Order = mongoose.model('Order');
var Buyer = mongoose.model('Buyer');

function fetchShop(shop) {
    shop.platform_shop_id = shop['id'];
    shop.title = shop['name'];
    shop.support_email = shop['customer_email'];
    shop.platform_plan = shop['plan_name'];
    shop.owner_email = shop['email'];
    shop.owner_name = shop['shop_owner'];
    shop.ecommercePlatform = ecommercePlatform;
    shop.auth = auth;
    shop.domain = shop['myshopify_domain'];
}

function fetchProduct(product) {
    // console.log('pID: ',product.id);
    product.external_id = product['id'];
    product.description = product['metafields_global_description_tag'];
    product.image_url = product.images.length ? product.images[0].src : '';
}

function fetchOrder(order) {
    order.external_id = order['id'];
    if(order.customer) order.buyer_id = order.customer['id'];
}

function fetchBuyer(buyer) {
    buyer.external_id = buyer['id'];
    buyer.user_email = buyer['email'];
    buyer.user_phone = buyer['phone']
}

function updateOrder(order) {
    fetchOrder(order);

    Order.findOneAndUpdate({external_id: order.external_id}, order, {new: true}, (err, or)=>
    {
        if(or) console.log(`order ${or.external_id} was updated`);
    });
}

function updateBuyer(buyer) {
    fetchBuyer(buyer);

    Buyer.findOneAndUpdate({external_id: buyer.external_id}, buyer, {new: true}, (err, buyer)=>
    {
        if(buyer) console.log(`buyer ${buyer.external_id} was updated`);
    });
}

router.get('/delete-all/:shopid', async (req, res) => {
    Shop.findOne({platform_shop_id: req.params.shopid}).exec((err, shop) => {
        if(err)
            res.send(err);
       for(let i = 0; i < shop.webhooks.length; i++) {
            fetch(`https://${shop.domain}/admin/webhooks/${shop.webhooks[i]}.json`, {method: 'DELETE', headers: {
                   'Content-Type': 'application/json',
                   'X-Shopify-Access-Token': shop.auth.token
               }})
                .then(request => request.json())
                .catch(err => console.log(err));
       };
    });
});

router.post('/shop-uninstalled', (req, res, next) => {

    let shop = req.body;
    res.status(200).send();

    console.log(`shop ${shop.id} wants to uninstall`);
    Shop.findOneAndUpdate({platform_shop_id: shop.id}, {is_active: false}, null, (err, shop) => {
        if(err) {
            console.log(err);
        } else {
            let settings = shop.settings;
            if((settings.recurring.length > 0) && (settings.recurring[0].activated_on)) {
                settings.recurring[0].status = 'cancelled';
                settings.recurring[0].cancelled_on = Date.now();

                Settings.findOneAndUpdate({shop_domain: shop.domain}, {recurring: settings.recurring}, null, (err) => {
                    if(err) {
                        console.log(err);
                    }
                })
            }
        }
    }).populate('settings','-_id');
});

router.post('/shop-update', (req, res, next) => {

    let shop = req.body;
    res.status(200).send();

    fetchShop(shop);

    Shop.findOneAndUpdate({platform_shop_id: shop.platform_shop_id}, shop, {new: true}, (err, shop)=>
    {
        if(shop) {
            console.log(`Shop ${shop.platform_shop_id} was updated`);
        }
    });
});

router.post('/product-create', (req, res, next) => {

    let product = req.body;
    let shopDomain = req.headers["x-shopify-shop-domain"];
    res.status(200).send();

    Shop.findOne({domain: shopDomain}, (err, shop) => {
        if(!shop) {
            console.log('shop not exists');
        } else {
            fetchProduct(product);
            product.shop_id = shop.platform_shop_id;
            let newProduct = new Product(product);
            newProduct.save((err) => {
                if(err) console.log(err);
            });
        }
    })
});

router.post('/product-delete', (req, res, next) => {

    let product = req.body;
    res.status(200).send();

    Product.findOneAndRemove({external_id: product.id}, (err, prod)=>
    {
        if(!prod) {
            console.log(`product-delete: product ${product.id} does not exists.`);
        } else {
            console.log(`product ${product.id} was deleted`);
        }
    });
});

router.post('/product-update', (req, res, next) => {

    let product = req.body;
    let shopDomain = req.headers["x-shopify-shop-domain"];

    res.status(200).send();

    fetchProduct(product);

    Product.findOneAndUpdate({external_id: product.external_id}, product, {new: true}, async (err, prod)=>
    {
        if(!prod) {
            let shop = await Shop.findOne({domain: shopDomain}).exec();
            if(shop) {
                product.shop_id = shop.platform_shop_id;
                let mongoProd = new Product(product);
                mongoProd.save().then(prd => console.log(`product ${prd.external_id} was saved and updated`));
            } else {
                console.log(`could not update product ${product.external_id}`);
            }
        }

        if(prod) {
            console.log(`product ${prod.external_id} was updated`);
        }
    });

});


router.post('/order-create', (req, res, next) => {

    let order = req.body;
    let shopDomain = req.headers["x-shopify-shop-domain"];
    res.status(200).send();

    Shop.findOne({domain: shopDomain}, (err, shop) => {
        if(!shop) {
            console.log(`shop ${shopDomain} does not exists.`);
        } else {
            fetchOrder(order);
            order.shop_id = shop.platform_shop_id;
            let newOrder = new Order(order);
            newOrder.save((err) => {
                if(err) console.log(err);
            });
        }
    })
});

router.post('/order-delete', (req, res, next) => {

    let order = req.body;
    res.status(200).send();

    Order.findOneAndRemove({external_id: order.id}, (err, order)=>
    {
        if(err) {
            console.log(err)
        } else {
            console.log(`order was deleted`);
        }
    });
});

router.post('/order-updated', (req, res, next) => {

    let order = req.body;
    res.status(200).send();

    // console.log(`Order ${order.id} updated`);
    updateOrder(order);
});

router.post('/order-cancelled', (req, res, next) => {

    let order = req.body;
    res.status(200).send();

    console.log(`Order ${order.id} cancelled`);
    updateOrder(order);
});

router.post('/order-fulfilled', (req, res, next) => {

    let order = req.body;
    res.status(200).send();

    console.log(order.fulfillments);
    console.log(`Order ${order.id} fulfilled`);
    updateOrder(order);
});

// Buyer Webhooks
router.post('/customers-create', (req, res, next) => {

    let buyer = req.body;
    let shopDomain = req.headers["x-shopify-shop-domain"];
    res.status(200).send();

    Shop.findOne({domain: shopDomain}, (err, shop) => {
        if(!shop) {
            console.log(`shop ${shopDomain} does not exists.`);
        } else {
            fetchBuyer(buyer);
            buyer.shop_id = shop.platform_shop_id;
            let newBuyer = new Buyer(buyer);
            newBuyer.save((err) => {
                if(err) console.log(err);
            });
        }
    });
});

router.post('/customers-delete', (req, res, next) => {

    let buyer = req.body;
    res.status(200).send();

    Buyer.findOneAndRemove({external_id: buyer.id}, (err, buyer)=>
    {
        if(err) {
            console.log(err)
        } else {
            console.log(`buyer was deleted`);
        }
    });
});

router.post('/customers-update', (req, res, next) => {

    let buyer = req.body;
    res.status(200).send();

    // console.log(`buyer ${buyer.id} updated`);
    updateBuyer(buyer);
});


/*
GDPR requirements

WEBHOOK PAYLOAD:

    {
      "shop_id": "<ID>",
      "shop_domain": "<domain>",
      "customer": {
        "id": "<ID>",
        "email": "<email>",
        "phone": "<phone>"
      },
      "orders_to_redact": ["<order ID>", "<order ID>", "<order ID>"]
    }
 */
router.post('/customers/redact', (req, res, next) => {

    let data = req.body;
    res.status(200).send();

    console.log(data);
    //Delete customer information from DB
    Order.updateMany({buyer_id: data.customer.id}, {email: "", phone: "", buyer_id: "GDPR"}, null, (err, orders) => {
        if(err) {
            console.log(err);
        } else {
            console.log(orders);
        }
    });

    Buyer.remove({buyer_id: data.customer.id}, (err, buyer)=>{
        if(err) {
            console.error(err);
        } else {
            console.log(`buyer ${data.customer.id} removed`);
        }
    });
});


// router.get('/customers/redact', (req, res, next) => {
//
//     let data = req.body;
//     res.status(200).send();
//
//     // console.log(data);
//     //Delete customer information from DB
//     Order.updateMany({buyer_id: data.customer.id}, {email: "", phone: "", buyer_id: "GDPR"}, null, (err, orders) => {
//         if(err) {
//             console.log(err);
//         } else {
//             console.log(orders);
//         }
//     });
//     Buyer.remove({buyer_id: data.customer.id}, (err, buyer)=>{
//         if(err) {
//             console.error(err);
//         } else {
//             console.log(`buyer ${data.customer.id} removed`);
//         }
//     });
// });

/*
WEBHOOK PAYLOAD:
    {
        "shop_id": "<ID>",
        "shop_domain": "<domain>"
    }
*/

router.post('/shop/redact', (req, res, next) => {
    let data = req.body;
    res.status(200).send();

    //Delete shop customers information from DB
    Order.updateMany({shop_id: data.shop_id}, {email: "", phone: "", buyer_id: "GDPR"});
    Buyer.remove({shop_id: data.shop_id}, ()=>{});
});

// router.get('/shop/redact', (req, res, next) => {
//     let data = req.body;
//     res.status(200).send();
//
//     //Delete shop customers information from DB
//     Order.updateMany({shop_id: data.shop_id}, {email: "", phone: "", buyer_id: "GDPR"});
//     Buyer.remove({shop_id: data.shop_id}, ()=>{});
// });

module.exports = router;