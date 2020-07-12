var express = require("express")
var router = express.Router()

const paypal = require('paypal-rest-sdk');

var db = require('../mysqlConfig');

var jwt = require('jsonwebtoken');

var sendEmail = require("../nodemailerConfig");

var createReceiptEmail = require("../html/receiptEmail")

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.PAYPAL_ID,
    'client_secret': process.env.PAYPAL_SECRET
});

//TODO: Figure out a better way to go about this. This is very bad if a second purchase starts before the one before has finished. Maybe a queue of some sort?
let coins = [];
let subtotal = 0;

//TODO: Allow admins to configure taxRate rate and shipping
let taxRate = 1.00;
let shipping = 5.00;
let userID = -1;
let shippingInfo = {};

//must buy $5 or more worth of products
const minPurchase = 5.00;

//get user id from token if a token is sent
function getUserID(req) {

    var token = req.headers['x-access-token'];
    let id = undefined

    if (token) {

        jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
            if (!err) {
                id = decoded.id;
            }

        });

    }

    return id;

}

router.post('/pay', (req, res) => {

    coins = []
    subtotal = 0;
    shippingInfo = {}

    decodedID = getUserID(req);
    if (decodedID != undefined) {
        userID = decodedID;
    } else {
        console.log("setting to -1 even tho id is " + decodedID)
        userID = -1;//-1 means they aren't logged in
    }
    console.log("requesting ID: " + userID)
    //validate shipping info
    // `orders`.`id`,
    // `orders`.`userid`,
    // `orders`.`status`,
    // `orders`.`date`,
    // `orders`.`total`,
    // `orders`.`first_name`,
    // `orders`.`last_name`,
    // `orders`.`address`,
    // `orders`.`address_2`, opt.
    // `orders`.`city`,
    // `orders`.`state`,
    // `orders`.`zip`,
    // `orders`.`phone`,
    // `orders`.`email`
    console.log(req.body.shipping);
    if (!req.body.shipping.firstName || !req.body.shipping.lastName || !req.body.shipping.address || !req.body.shipping.city
        || !req.body.shipping.state || !req.body.shipping.zip || !req.body.shipping.phone || !req.body.shipping.email) {
        console.log("missing shipping info")
        return res.status(400).send({ message: "Something went wrong. Make sure you've filled out all required fields." })
    }

    shippingInfo = req.body.shipping;

    if (req.body.coins.length <= 0) {
        console.log("0 coins")
        return res.status(400).send({ message: "Something went wrong. Make sure you've filled out all required fields.", error: "Trying to purchase 0 coins." })
    }

    db.query('SELECT * FROM store_settings', (err, rows) => {
        if (err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        taxRate = rows[0].tax_rate/100;
        taxRate = taxRate/100;
        shipping = rows[0].shipping_fee/100;
    })

    //remove duplicate coins
    coins = [...(new Set(req.body.coins))];

    //format sent coin ids to (id, id, id) for our query
    idsQuery = ""

    coins.forEach((coinId) => {
        idsQuery += ", " + coinId
    })

    //trim first ',' off
    idsQuery = idsQuery.substring(1);

    //get the coins that the client wants to purchase from the DB
    db.query(`SELECT * FROM coins WHERE id in (${idsQuery})`, (err, rows) => {
        if (err) {
            console.log("bad coin ids")
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }

        coins = rows;

        let items = [];
        coins.forEach((coin) => {

            //make sure the coin the client is buying is actually for sale
            if (!coin.status == 1) {
                console.log("coins not for sale")
                return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
            }

            subtotal += coin.price / 100;
            items.push({
                "name": coin.name,
                "price": (coin.price / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                "currency": "USD",
                "quantity": 1
            });
        })

        if (subtotal < minPurchase) {
            console.log("minpurch")
            return res.status(400).send({ message: "Something went wrong. Make sure you've filled out all required fields.", error: `You must purchase at least $${minPurchase} worth of product.` })
        }
        console.log("subtotal:" + subtotal)
        console.log("TOTAL: " + (subtotal + parseFloat((subtotal * taxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + shipping).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": process.env.PAYPAL_RETURN_URL,
                "cancel_url": process.env.PAYPAL_CANCEL_URL
            },
            "transactions": [{
                "item_list": {
                    "items": items
                },
                "amount": {
                    "currency": "USD",
                    "total": (subtotal + parseFloat((subtotal * taxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + shipping).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    "details": {
                        "subtotal": subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        "tax": (subtotal * taxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        "shipping": shipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                },
                "description": "Pennies and other items from pennytrader.com!"
            }]
        };

        console.log(JSON.stringify(create_payment_json))

        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                console.log(JSON.stringify(error))
                return res.status(400).send({ message: "Something went wrong. Please try again.", errors: error })
            } else {
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        res.set('Content-Type', 'text/html')
                        return res.send(payment.links[i].href);
                        // res.redirect(payment.links[i].href);
                    }
                }
            }
        });
    })

});

router.get('/success', (req, res) => {

    console.log("success")
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": (subtotal + parseFloat((subtotal * taxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + shipping).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            return res.redirect(process.env.PAYPAL_FAILED_REDIRECT);
        } else {
            // Payment completed successfully, lets make a new order in our db with all the info
            //TODO: Add new fields 
            // `orders`.`id`,
            // `orders`.`userid`,
            // `orders`.`status`,
            // `orders`.`date`,
            // `orders`.`total`,
            // `orders`.`first_name`,
            // `orders`.`last_name`,
            // `orders`.`address`,
            // `orders`.`address_2`, opt.
            // `orders`.`city`,
            // `orders`.`state`,
            // `orders`.`zip`,
            // `orders`.`phone`,
            // `orders`.`email`
            db.query(`INSERT INTO orders(userid, status, date, total, first_name, last_name, address, address_2, city, state, zip, phone, email) VALUES (${userID}, 
                ${0}, NOW(), ${(subtotal + parseFloat((subtotal * taxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + shipping) * 100}, '${shippingInfo.firstName}', '${shippingInfo.lastName}', '${shippingInfo.address}', '${shippingInfo.address2}',
                '${shippingInfo.city}', '${shippingInfo.state}', '${shippingInfo.zip}', '${shippingInfo.phone}', '${shippingInfo.email}')`, (err, results, fields) => {
                if (err) {
                    //This should never error, but if it does it's VERY bad. We took their money but never created an order for them.
                    //Maybe log errors like this to the db in the future just to be safe?
                    console.log("MYSQL ERROR")
                    return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
                }
                coins.forEach((coin) => {
                    //relate this coin to the order with the order_items table

                    db.query(`INSERT INTO order_items(orderid, coinid) VALUES (${results.insertId}, ${coin.id})`, (err, rows) => {
                        if (err) {
                            //This should never error, but if it does it's VERY bad. We took their money but never created an order for them.
                            //Maybe log errors like this to the db in the future just to be safe?
                            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
                        }
                    })
                    //set coins as sold
                    db.query(`UPDATE coins SET status = 2 WHERE id = ${coin.id}`, (err, rows) => {
                        if (err) {
                            //This should never error, but if it does it's VERY bad. We took their money but never created an order for them.
                            //Maybe log errors like this to the db in the future just to be safe?
                            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
                        }

                    })
                })

                res.redirect(process.env.PAYPAL_SUCCESS_REDIRECT);

                sendEmail(shippingInfo.email, `Thank you for your purchase, ${shippingInfo.firstName}!`, createReceiptEmail(shippingInfo.firstName, coins, parseFloat((subtotal * taxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + shipping, (subtotal + parseFloat((subtotal * taxRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })) + shipping) ))

            })
        }
    });
});

router.get('/cancel', (req, res) => res.redirect(process.env.PAYPAL_FAILED_REDIRECT));

router.get('/taxandshipping', (req, res) => {
    db.query('SELECT * FROM store_settings', (err, rows) => {
        if (err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({ data: rows[0] });
    })
})

module.exports = router