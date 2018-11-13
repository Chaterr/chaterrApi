const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Shop = mongoose.model('Shop');
const Product = mongoose.model('Product');
const Order = mongoose.model('Order');
const Buyer = mongoose.model('Buyer');
const User = mongoose.model('User');

let Shopify = require('shopify-prime');

router.get('/shop', (req, res, next) => {
    if(req.query.order_id) {
        Order.findOne({external_id: req.query.order_id}).populate('shop').exec((err, order) => {
            if(!order) {
                res.status(404).send(err);
            } else {
                res.json({chaterr_shop_id: order.shop._id, shop_id: order.shop.platform_shop_id , shop_domain: order.shop.domain, shop_name: order.shop.title});
            }
        });
    } else if(req.query.buyer_id) {
        Buyer.findOne({external_id: req.query.buyer_id}).populate('shop').exec((err, buyer) => {
            if(!buyer) {
                res.status(404).send(err);
            } else {
                res.json({shop_id: buyer.shop.platform_shop_id , shop_domain: buyer.shop.domain, shop_name: buyer.shop.title});
            }
        });
    } else if(req.query.shop_id) {
        Shop.findOne({platform_shop_id: req.query.shop_id}).exec((err, shop) => {
            if(!shop) {
                res.status(404).send(err);
            } else {
                res.send({shop_domain: shop.domain, shop_name: shop.title});
            }
        });
    } else {
        res.send.status(404).send();
    }
});

router.get('/shop/:shop_id', (req, res, next) => {

    let fields = req.query.settings_fields ? req.query.settings_fields.replace(/,/g," ") : '';
    const shop_id = req.params.shop_id;

    Shop.findById(shop_id).populate('settings',`${fields} -_id`).lean().exec((err, shop) => {
        // console.log(shop);
        if(!shop) {
            res.status(404).send();
        } else {
            let setup =   {
                host: `https://${shop.domain}`,
                target_pfn: `${shop.company}.${shop.project}`,
                stick_to_native: "TRUE",
                shop_demo_type: "0",
                shop_currency: shop.currency,
                shop_lang: shop.primary_locale ? shop.primary_locale.toUpperCase() : '',
                shop_tech: shop.ecommercePlatform,
                shop_title: shop.title,
                shop_flag: shop.platform_shop_id,
                shop_facebook_page: "",
                user_pass: "",
                hmac_test_key: shop.auth.hmac,
                access_token: shop.auth.token,
            };

            res.json({json_format: 'chaterr', setup: setup, settings: shop.settings});
        }
    });
});

router.get('/shop/:shop_id/pfn', (req, res, next) => {
    const shop_id = req.params.shop_id;
    Shop.findById(shop_id).exec((err, shop) => {
        if(err) {

        } else {
            res.json(shop.pfn);
        }
    });
});

router.get('/orders', (req, res, next) => {

    let filter = JSON.parse(JSON.stringify({
        shop_id: req.query.shop_id,
        buyer_id: req.query.buyer_id,
        external_id: req.query.order_id,
    }));

    let limit = req.query.limit ? req.query.limit : 0;
    let fields = req.query.fields ? req.query.fields.replace(/,/g," ") : '';

    Order.find(filter, {'_id':0}).limit(+limit).select(fields).lean().exec((err, orders) => {
        if(err) {
            res.status(404).send(err);
        }

        res.send({json_format: 'chaterr', orders: orders});
    });
});

router.get('/orders/:id', (req, res, next) => {
    Order.findOne({external_id: req.params.id}).populate('shop').select('buyer_id shop_id shop.domain -_id').exec((err, order) => {
        if(!order) {
            res.status(404).send(err);
        } else {
            res.json({json_format: 'chaterr', buyer_id: order.buyer_id, shop: order.shop.domain});
        }
    });
});

router.get('/hot_deals', (req, res, next) => {
    res.status(200).json({
        message: 'Handling hot_deals'
    });
});

router.get('/coupons', (req, res, next) => {
    res.status(200).json({
        message: 'Handling coupons'
    });
});

router.get('/users', (req, res, next) => {
    let filter = JSON.parse(JSON.stringify({
        fbid: req.query.fbid,
        company: req.query.company,
        project: req.query.project
    }));

    let fields = req.query.mem_type != undefined ? `fbid ${req.query.mem_type} company project` : '';

    User.find(filter, {'_id':0}).select(fields).exec((err, users) => {
        if(err) {
            res.status(404).send(err);
        } else {
            res.send({json_format: 'chaterr', users: users});
        }
    });
});

router.post('/users', (req, res, next) => {
    const options = { upsert: true, setDefaultsOnInsert: true };
    const newUser = req.body;
    newUser[req.body.mem_type] = req.body.mem_data;

    User.findOneAndUpdate({fbid: req.body.fbid}, newUser, options, (err, user) => {
       if(err) {
           res.status(409).send(err.message);
       } else {
           res.status(200).send({json_format: 'chaterr', user: user});
       }
    });
});

router.delete('/users/:fbid', (req, res, next) => {
    User.remove({fbid: req.params.fbid}, (err, user) => {
       if(err) {
           res.status(404).send(err);
       } else {
           res.send({});
       }
    });
});

router.get('/buyers', (req, res, next) => {
    let filter = JSON.parse(JSON.stringify({
        user_email: req.query.email,
        user_phone: req.query.phone,
    }));

    Buyer.find(filter, {'_id':0}).populate('orders').populate('shop').select().exec((err, buyers) => {
        if(err) {
            res.status(404).send(err);
        } else {
            buyers = buyers.map((buyer) => {
                return ({
                        first_name: buyer.first_name,
                        last_name: buyer.last_name,
                        buyer_id: buyer.external_id,
                        shop_id: buyer.shop_id,
                        shop_domain: buyer.shop.domain,
                        orders: buyer.orders.map((or) => or.external_id).join(',')
                    });
            });

            res.send({count: buyers.length, buyers: buyers});
        }
    });
});

router.get('/shop_id', (req, res, next) => {
    let filter = JSON.parse(JSON.stringify({
        domain: req.query.shop_name
    }));

    Shop.findOne(filter).exec((err, shop) => {
        if(!shop) {
            res.status(404).send();
        } else {
            res.send(shop.platform_shop_id);
        }
    });
});

async function getPriceRule(shop_domain, shop_token, discount) {
    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shop_token
        },
        credentials: 'include',
    };

    let url = `https://${shop_domain}/admin/price_rules/${discount.id}.json`;
    let pricerule = await fetch(url, options).then((response) => response.json()).then((data) => {
        if(data.errors) {
            return null;
        } else {
            return data.price_rule
        }
    });

    return pricerule;
}

router.get('/shop_record', (req, res, next) => {

    let filter = JSON.parse(JSON.stringify({
        platform_shop_id: req.query.shop_id
    }));

    let title = req.query.title;

    Shop.findOne(filter).populate('settings').exec(async (err, shop) => {
        if(!shop) {
            res.status(404).send();
        } else {
            // console.log('Found shop:', shop);
            let setup = {
                internal_shop_id: shop._id,
                external_shop_id: shop.platform_shop_id,

                shop_auth_token: shop.auth.token,
                shop_auth_hmac: shop.auth.hmac,
                shop_auth_userpass: shop.shop_auth_userpass,

                shop_technology:	shop.ecommercePlatform,
                shop_title: 		shop.title,
                shop_is_active: 	shop.is_active.toString(),

                shop_currency: 		shop.currency,
                shop_country_code: 	shop.country_code,
                shop_primary_locale: shop.primary_locale,
                shop_lang:          shop.primary_locale,
                shop_domain: 		shop.domain,
                shop_bot_name: 		shop.bot_name,
                shop_host:          `https://${shop.domain}`,
                shop_demo_type:     shop.shop_demo_type.toString(),
                shop_facebook_page: shop.shop_facebook_page,

                chatter_project: 	shop.project,
                chatter_company: 	shop.company,
                chatter_pfn:        shop.pfn,

                webhook_notification_welcome: shop.settings.notifications.welcome ? 'true' : 'false',
                webhook_notification_order_confirmation: shop.settings.notifications.order_confirmation.toString(),
                webhook_notification_shipping_alert_fulfillment: shop.settings.notifications.shipping_alert.fulfillment.toString(),
                webhook_notification_shipping_alert_currier: shop.settings.notifications.shipping_alert.currier.toString(),
                webhook_notification_shipping_alert_collect: shop.settings.notifications.shipping_alert.collect.toString(),
                webhook_notification_satisfaction_survey: shop.settings.notifications.satisfaction_survey.status.toString(),
                webhook_notification_satisfaction_survey_after_collect: shop.settings.notifications.satisfaction_survey.after_collect.toString(),
                webhook_notification_satisfaction_survey_after_fulfill: shop.settings.notifications.satisfaction_survey.after_fulfillment.toString(),

                agent_escalation_email: shop.settings.agent.email,
                agent_escalation_integration: shop.settings.agent.integration,

                feedback_notify_threshold: 	shop.settings.feedback.notify_stars.toString(),
                feedback_review_url_1:	shop.settings.feedback.review_links[0].url,
                feedback_review_url_2:	shop.settings.feedback.review_links[1].url,
                feedback_review_url_3:	shop.settings.feedback.review_links[2].url,
                feedback_review_title_1:	shop.settings.feedback.review_links[0].title,
                feedback_review_title_2:	shop.settings.feedback.review_links[1].title,
                feedback_review_title_3:	shop.settings.feedback.review_links[2].title,

                return_terms_doc_url: shop.settings.returns.terms.doc_url,
                return_terms_para_1: shop.settings.returns.terms.first_para,
                return_terms_para_2: shop.settings.returns.terms.second_para,
                return_terms_para_3: shop.settings.returns.terms.third_para,
                return_question_to_buyer_1:	shop.settings.returns.agent.first_question,
                return_question_to_buyer_2:	shop.settings.returns.agent.second_question,
                return_question_to_buyer_3:	shop.settings.returns.agent.third_question,
                return_request_from_buyer_photo: shop.settings.returns.agent.request_photo.toString(),
                return_request_from_buyer_email: shop.settings.returns.agent.request_email.toString(),
                return_request_from_buyer_phone: shop.settings.returns.agent.request_phone.toString(),
                faq_rec_count: shop.settings.faq.questions.length.toString(),
            };

            shop.settings.faq.questions.forEach((faq, i) => {
                setup[`faq_${i}_status`] = faq.status.toString();
                setup[`faq_${i}_question`] = faq.question;
                setup[`faq_${i}_answer`] = faq.answer;
                setup[`faq_${i}_nlp_flag`] = faq.nlp_flag;
                setup[`faq_${i}_group`] = faq.group.toString();
            });

            let freeShipping = await getPriceRule(shop.domain, shop.auth.token, shop.settings.discount.free_shipping);
            let percentage = await getPriceRule(shop.domain, shop.auth.token, shop.settings.discount.percentage);
            let fixed = await getPriceRule(shop.domain, shop.auth.token, shop.settings.discount.fixed);
            let buyxgety = await getPriceRule(shop.domain, shop.auth.token, shop.settings.discount.buy_x_get_y);

            setup["discount_free_shipping_status"] = freeShipping ? (freeShipping.ends_at ? 'disable' : 'enable') : '';
            setup["discount_free_shipping_code"] = freeShipping ? freeShipping.title : '';
            setup["discount_free_shipping_title"] = freeShipping ? 'Sally Free Ship' : '';
            setup["discount_free_shipping_sub_title"] = freeShipping ? 'Get free-shipping coupon for your next order': '';
            setup["discount_free_shipping_image"] = freeShipping ? "coupon_free_shipping.jpg" : '';
            setup["discount_free_shipping_cta"] = freeShipping ? "Get Coupon" : '';

            setup["discount_percentage_status"] = percentage ? (percentage.ends_at ? 'disable' : 'enable') : '';
            setup["discount_percentage_code"] = percentage ? percentage.title : '';
            setup["discount_percentage_title"] = percentage ? 'Sally Sale' : '';
            setup["discount_percentage_sub_title"] = percentage ? 'Get discount-code for your next order' : '';
            setup["discount_percentage_image"] = percentage ? "coupon_discount.jpg" : '';
            setup["discount_percentage_cta"] = percentage ? "Get Coupon" : '';

            setup["discount_fixed_status"] = fixed ? (fixed.ends_at ? 'disable' : 'enable') : '';
            setup["discount_fixed_code"] = fixed ? fixed.title : '';
            setup["discount_fixed_title"] = fixed ? 'Sally Sale' : '';
            setup["discount_fixed_sub_title"] = fixed ? fixed.title : '';
            setup["discount_fixed_image"] = fixed ? "coupon_fixed_discount.jpg" : '';
            setup["discount_fixed_cta"] = fixed ? "Get Coupon" : '';

            setup["discount_buyxgety_status"] = buyxgety ? (buyxgety.ends_at ? 'disable' : 'enable') : '';
            setup["discount_buyxgety_code"] = buyxgety ? buyxgety.title : '';
            setup["discount_buyxgety_title"] = buyxgety ? 'Sally buy X get Y' : '';
            setup["discount_buyxgety_sub_title"] = buyxgety ? buyxgety.title : '';
            setup["discount_buyxgety_image"] = buyxgety ? "coupon_buyxgety_discount.jpg" : '';
            setup["discount_buyxgety_cta"] = buyxgety ? "Get Coupon" : '';
            // let ob = {};
            // ob[title] = setup[title];
            res.json(title ? setup[title] : setup);
        }
    });
});

router.get('/order_record/all', (req, res, next) => {
    Order.find().lean().exec((err, orders) => {
        if(err) {
            res.status(404).send(err);
        } else {
            let setup = [];
            orders.forEach((order,i) => {
                let obj = {
                    internal_order_id: order._id,

                    external_order_id:	order.external_id,
                    external_buyer_id:	order.buyer_id,
                    external_shop_id:	order.shop_id,

                    order_create_date:	order.created_at,
                    order_total_price:	order.total_price,
                    order_subtotal_price:	order.subtotal_price,
                    order_total_tax: order.total_tax,
                    order_currency: order.currency,
                    order_number: order.order_number,
                    order_discount_adjustments:	order.discount_adjustments,
                };

                order.line_items.forEach((item, i) => {
                    obj[`item_${i}_id`] = item.id;
                    obj[`item_${i}_variant_id`] = item.variant_id;
                    obj[`item_${i}_product_id`] = item.product_id;
                    obj[`item_${i}_variant_title`] = item.variant_title;
                    obj[`item_${i}_title`] = item.title;
                    obj[`item_${i}_quantity`] = item.quantity;
                    obj[`item_${i}_price`] = item.price;
                    obj[`item_${i}_vendor`] = item.vendor;
                });

                setup.push(obj);
            });

            res.json(setup);
        }
    });
});

let getOrderFromShop = async function(shop_domain, order_id) {
    try {
        const shop = await Shop.findOne({domain: shop_domain}).exec();
        // console.log(shop);
        if(shop) {
            console.log("found shop: ", shop.platform_shop_id);
            const service = new Shopify.Orders(shop.domain, shop.auth.token);
            let or = await service.get(order_id);
            if(or) {
                or.external_id = or.id;
                or.shop_id = shop.platform_shop_id;
                or.shop = shop;
                if(or.customer) {
                    or.buyer_id = or.customer['id'];
                }

                let mongoOrder = new Order(or);
                mongoOrder.save().then(ord => console.log('saved order: ', ord.external_id));

                return or;
            } else {
                return null;
            }

        } else {
            console.log('no shop ', shop_domain);
            throw 'err with shop';
        }

    } catch (err) {
        // console.log("error: ", err);
        return null;
    }
};

router.get('/order_record', (req, res, next) => {

    let shop_domain = req.query.shop_domain;
    let order_id = req.query.order_id;
    let title = req.query.title;

    let filter = JSON.parse(JSON.stringify({
        external_id: order_id
    }));

    // console.log(req.query);

    Order.findOne(filter).lean().populate('shop').exec(async (err, order) => {
        try {
            // console.log("order: ", order.external_id);
            if(!order) {
                //Try to get the order from Shopify:
                // console.log('could not find order ', order_id);
                if(shop_domain) {
                    order = await getOrderFromShop(shop_domain, order_id);
                    console.log('found order: ', order.external_id);
                    if(!order) {
                        res.status(404).send();
                    }
                } else {
                    res.status(404).send();
                }
            }

            //Search if user exists
            let buyer = await Buyer.findOne({external_id: order.buyer_id}).exec();
            if(!buyer) {
                const options = {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': order.shop.auth.token
                    },
                    credentials: 'include',
                };

                fetch(`https://${order.shop.domain}/admin/customers/${order.buyer_id}.json`, options)
                    .then((response => response.json()))
                    .then((customer) => {
                        customer = customer.customer;
                        customer.shop_id = order.shop_id;
                        customer.external_id = customer['id'];
                        customer.user_email = customer['email'];
                        customer.user_phone = customer['phone'];

                        let mongoBuyer = new Buyer(customer);
                        mongoBuyer.save().then(buy => console.log('saved buyer: ', buy.external_id));
                    });
            }
            // console.log("shop is: ", order.shop);
            // console.log("shop is: ", order.shop);

            if(order) {
                let setup = {
                    internal_order_id:	'',
                    external_order_id:	'',
                    external_buyer_id:	'',
                    external_shop_id:	'',

                    order_create_date:	'',
                    order_currency:		'',
                    order_number:		'',
                    order_discount_adjustments:	'',
                    order_country_code: '',
                    order_longitude: '',
                    order_latitude: '',
                    order_payment_method: '',
                    order_payment_status: '',
                    order_fulfillment_status: '',
                    order_matrix_status: '',

                    order_tracking_number: '',
                    order_tracking_url: '',
                    order_tracking_company: '',
                    order_shop_title: '',

                    order_status_url: '',
                    order_updated_at: '',
                    order_address_1: '',
                    order_address_2: '',
                    order_address_city: '',
                    order_address_zip: '',
                    order_address_province_code: '',
                    order_address_country_code: '',

                    order_subtotal_price: '',
                    order_shipping_price: '',
                    order_total_tax: '',
                    order_total_price: '',
                };

                try {

                    if(order.fulfillments && order.fulfillments.length) {
                        let fullfilment = order.fulfillments[0];
                        setup.order_tracking_number = fullfilment.tracking_number ?  fullfilment.tracking_number : '';
                        setup.order_tracking_url = fullfilment.tracking_url ? fullfilment.tracking_url : '';
                        setup.order_tracking_company = fullfilment.tracking_company ? fullfilment.tracking_company : '';
                    }

                    if(order.shipping_address) {
                        setup.order_latitude = order.shipping_address.latitude ? order.shipping_address.latitude.toString() : '';
                        setup.order_longitude = order.shipping_address.longitude? order.shipping_address.longitude.toString() : '';
                        setup.order_address_1 = order.shipping_address.address1 ? order.shipping_address.address1 : '';
                        setup.order_address_2 = order.shipping_address.address2 ? order.shipping_address.address2 : '';
                        setup.order_address_city = order.shipping_address.city ? order.shipping_address.city : '';
                        setup.order_address_zip = order.shipping_address.zip ? order.shipping_address.zip : '';
                        setup.order_address_province_code = order.shipping_address.province_code ? order.shipping_address.province_code : '';
                        setup.order_address_country_code = order.shipping_address.country_code ? order.shipping_address.country_code : '';
                    }

                    let shipping_price = parseFloat(0.00).toFixed(2);
                    if(order.shipping_lines && order.shipping_lines.length) {
                        order.shipping_lines.forEach(shipping => {
                            shipping_price = (parseFloat(shipping_price) + parseFloat(shipping.price)).toFixed(2);
                        });
                    }

                    setup.internal_order_id = order._id;

                    setup.external_order_id = order.external_id ? order.external_id.toString() : '';
                    setup.external_buyer_id = order.buyer_id? order.buyer_id.toString() : '';
                    setup.external_shop_id = order.shop_id ? order.shop_id.toString() : '';

                    setup.order_shop_title = order.shop.title ? order.shop.title : '';

                    setup.order_payment_method = ((order.payment_gateway_names) && (order.payment_gateway_names.length)) ? order.payment_gateway_names[0] : '';
                    setup.order_payment_status = order.financial_status ? order.financial_status : '';
                    setup.order_fulfillment_status = order.fulfillment_status ? order.fulfillment_status : '';
                    setup.order_matrix_status = '';

                    setup.order_create_date = order.created_at;
                    setup.order_updated_at = order.order_updated_at ? order.order_updated_at : '';
                    setup.order_total_price = order.total_price ? order.total_price : '';
                    setup.order_subtotal_price = order.subtotal_price ? order.subtotal_price : '';
                    setup.order_shipping_price = shipping_price.toString();

                    setup.order_total_tax = order.total_tax ? order.total_tax : '';
                    setup.order_currency = order.currency ? order.currency : '';
                    setup.order_number = order.order_number ? order.order_number.toString() : '';
                    setup.order_discount_adjustments = ((order.discount_adjustments) && (order.discount_adjustments.length)) ? order.discount_adjustments[0] : '';
                    setup.order_country_code = order.shipping_address ? order.shipping_address.country_code : "";
                    setup.order_status_url = order.order_status_url ? order.order_status_url : '';

                    setup.order_items_count = order.line_items.length.toString();
                } catch (e) {
                    console.log(e);
                    res.send(e.message);
                }

                let items = await Promise.all(order.line_items.map(async (item, i) => {
                    let product = await Product.findOne({external_id: item.product_id}).exec();
                    // console.log("product :", product);
                    if(!product) {
                        try {
                            const service = new Shopify.Products(order.shop.domain, order.shop.auth.token);
                            let pr = await service.get(item.product_id);
                            pr.external_id = pr['id'];
                            pr.description = pr['metafields_global_description_tag'];
                            pr.image_url = pr.images.length ? pr.images[0].src : '';
                            // console.log('found product: ', pr.id);
                            let mongoProd = new Product(pr);
                            mongoProd.save().then(prd => console.log('saved product: ', prd.external_id));

                            product = pr;
                        } catch (e) {
                            throw 'Bad Request - check product_id in line-items';
                        }
                    }

                    if(product) {
                        try {
                            // console.log(product.image_url);
                            // setup[`order_item${i}_id`] = item.id.toString();
                            setup[`order_item_${i}_variant_id`] = item.variant_id.toString();
                            setup[`order_item_${i}_product_id`] = item.product_id.toString();
                            setup[`order_item_${i}_variant_title`] = item.variant_title ? item.variant_title : '';
                            setup[`order_item_${i}_title`] = item.title ? item.title : '';
                            setup[`order_item_${i}_quantity`] = item.quantity.toString();
                            setup[`order_item_${i}_price`] = item.price ? item.price : '';
                            setup[`order_item_${i}_vendor`] = item.vendor ? item.vendor : '';
                            setup[`order_item_${i}_image_url`] = product.image_url ? product.image_url : '';

                            // console.log('setup!!! ', setup);

                        } catch (e) {
                            console.log(e);
                            return false;
                            // res.status(404).send(e.message);
                        }
                    }

                    return true;
                }));

                res.json(title ? setup[title] : setup);
            }

        } catch (e) {
            console.log(e);
            res.status(404).send(e.message);
        }

    });
});

router.get('/buyer_record', (req, res, next) => {

    let filter = JSON.parse(JSON.stringify({
        external_id: req.query.buyer_id,
    }));

    let title = req.query.title;

    Buyer.findOne(filter).lean().populate('orders','external_id -_id -buyer_id').exec((err, buyer) => {
        if(!buyer) {
            res.status(404).send(err);
        } else {
            let orders = buyer.orders.map(order => order.external_id);

            let setup = {
                internal_buyer_id: buyer._id,

                external_buyer_id: buyer.external_id,
                external_shop_id: buyer.shop_id ? buyer.shop_id : '',

                buyer_first_name: buyer.first_name ? buyer.first_name : '',
                buyer_last_name: buyer.last_name ? buyer.last_name : '',
                buyer_fbid: '',
                buyer_email: buyer.user_email ? buyer.user_email : '',
                buyer_phone: buyer.user_phone ? buyer.user_phone : '',
                buyer_preferred_msg_channel: buyer.default_communication ? buyer.default_communication : '',

                buyer_orders_list: orders.join(","),
            };

            // let ob = {};
            // ob[title] = setup[title];
            res.json(title ? setup[title] : setup);
        }
    });
});

router.post('/analytics', async (req, res, next) => {
    // const data = req.body;
    let username = 'chaterr';
    let password = 'c2FBF2@9Rpn48ea';
    let shop_domain = req.body.shop;
    let auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
    let time = req.body.time_period;

    const shop = await Shop.findOne({domain: shop_domain}).exec();
    if(shop) {
        let shop_title = shop.title;

        let data = {
            query: {
                bool: {
                    must: [
                        { match: { type: "bot-logs"}},
                        { match: { tags:  "beats_input_codec_plain_applied"}},
                        { match: { shop_title:  shop_title}},
                        { match: { action:  "SentToAgent"}}
                    ],
                    filter: [
                        { range: { "@timestamp": { gte: `now-${time}`, lt :  "now"}}}
                    ]
                }
            }
        };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth
            },
            body: JSON.stringify(data),
        };

        let sentToAgent = await fetch(`https://elastic-api.chaterr.me/filebeat-*/_search?pretty`, options)
            .then((ret) => ret.json())
            .then((d) => d.hits.total)
            .catch((err) => console.log(err));

        data.query.bool.must[3].match.action = 'ShippingStatusMessage';
        options.body = JSON.stringify(data);
        let ShippingStatusMessage = await fetch(`https://elastic-api.chaterr.me/filebeat-*/_search?pretty`, options)
            .then((ret) => ret.json())
            .then((d) => d.hits.total)
            .catch((err) => console.log(err));

        data.query.bool.must[3].match.action = 'ShippingStatusTitle';
        options.body = JSON.stringify(data);
        let ShippingStatusTitle = await fetch(`https://elastic-api.chaterr.me/filebeat-*/_search?pretty`, options)
            .then((ret) => ret.json())
            .then((d) => d.hits.total)
            .catch((err) => console.log(err));

        data.query.bool.must[3].match.action = 'ReOrder';
        options.body = JSON.stringify(data);
        // console.log(options);
        let reOrder = await fetch(`https://elastic-api.chaterr.me/filebeat-*/_search?pretty`, options)
            .then((ret) => ret.json())
            .then((d) => d.hits.total)
            .catch((err) => console.log(err));

        data.query.bool.must[3].match.action = 'ShippingTrackingInfo';
        options.body = JSON.stringify(data);
        // console.log(options);
        let tracking = await fetch(`https://elastic-api.chaterr.me/filebeat-*/_search?pretty`, options)
            .then((ret) => ret.json())
            .then((d) => d.hits.total)
            .catch((err) => console.log(err));

        return Promise.all([sentToAgent, ShippingStatusMessage, ShippingStatusTitle, reOrder, tracking]).then((values) => {
            // console.log(values);
            res.send({
                sentToAgent: values[0],
                shippingStatusMessage: values[1],
                shippingStatusTitle: values[2],
                reOrder: values[3],
                trackingInfo: values[4]
            });
        });
    } else {
        res.status(404).send(`shop ${shop_domain} not exists`);
    }
});

module.exports = router;