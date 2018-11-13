require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');

//created model loading here
require('./api/models/shopModel');
require('./api/models/productModel');
require('./api/models/orderModel');
require('./api/models/buyerModel');
require('./api/models/userModel');
require('./api/models/settingsModel');

const shopifyRoutes = require('./api/routes/shopify');
const shopifyWebhooksRoutes = require('./api/routes/webhooks');
const shopRoutes = require('./api/routes/shops');
const productRoutes = require('./api/routes/products');
const ordersRoutes = require('./api/routes/orders');
const qbotRoutes = require('./api/routes/qbot');
const shopSettings = require('./api/routes/shopSettings');

const {
    MONGO_URL
} = process.env;


mongoose.Promise = global.Promise;

mongoose.connect(MONGO_URL)
    .then(
        () => {console.log("connected successfully to mongoose!")},
        err => {console.log("Error: ", err.message)}
    );

// app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use((res, req, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use('/shopify', shopifyRoutes);
app.use('/shopify/webhooks', shopifyWebhooksRoutes);
app.use('/shops', shopRoutes);
app.use('/products', productRoutes);
app.use('/orders', ordersRoutes);
app.use('/qbot', qbotRoutes);
app.use('/settings', shopSettings);

app.use((err, req, res, next) => {
    // console.log(err);
    const error = Error('Not Found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;