var express = require("express")
var router = express.Router()

var db = require('../mysqlConfig');

const bcrypt = require('bcryptjs');

// process.env.JWT_SECRET
var jwt = require('jsonwebtoken');

var validator = require('validator');

var passwordValidator = require('password-validator');

var restricted = require("../middleware/restricted")

var sendEmail = require("../nodemailerConfig");

var createVerifyEmail = require("../html/verifyEmail")

// Create a schema
var schema = new passwordValidator();

// Add properties to it
schema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits()                                 // Must have digits
    .has().not().spaces()                           // Should not have spaces

router.post('/register', (req, res) => {

    console.log(req.body)

    if (!req.body.username) {
        res.status(400).send({ message: "No username provided." })
        return
    }
    if (!validator.isLength("" + req.body.username, { min: 4, max: 15 })) {
        res.status(400).send({ message: "Username be between 4 and 15 characters long." })
        return
    }
    //Make sure username isn't already in use
    db.query(`SELECT id FROM users WHERE username = '${req.body.username}'`, (err, rows) => {
        if (err) {
            console.log(JSON.stringify(err))
            res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
            return
        }
        console.log("Rows gotten back from username in use check: " + rows)
        if (rows.length > 0) {
            console.log("already in use")
            res.status(400).send({ message: "Username already in use." })
            return
        }
        else {
            if (!req.body.email) {
                res.status(400).send({ message: "No email provided." })
                return
            }
            if (!validator.isEmail("" + req.body.email)) {
                console.log("invalid email")
                return res.status(400).send({ message: "Email is not valid.", test: "this is a test" })
            }
            //Make sure email isn't already in use
            db.query(`SELECT id FROM users WHERE email = '${req.body.email}'`, (err, result) => {
                if (err) {
                    console.log(JSON.stringify(err))
                    res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
                    return
                }
                console.log("Rows gotten back from email in use check: " + result)
                if (result.length > 0) {
                    res.status(400).send({ message: "Email already in use." })
                    return
                }
                else {
                    if (!req.body.password) {
                        res.status(400).send({ message: "No password provided." })
                        return
                    }
                    if (!schema.validate("" + req.body.password)) {
                        res.status(400).send({ message: "Password is too weak. Must be at least 8 characters long, have at least one upper and one lower case letter, and have at least one number.", errors: schema.validate("" + req.body.password, { list: true }) })
                        return
                    }

                    let verifyHash = Math.floor((Math.random() * 100000000000000));

                    //and finally:
                    bcrypt.hash('' + req.body.password, 10, function (err, hash) {
                        // Store new user info now that the password has finished hashing
                        db.query(`INSERT INTO users(passhash, email, username, verify_hash) VALUES('${hash}', '${req.body.email}', '${req.body.username}', '${verifyHash}')`, (err) => {
                            if (err) {
                                console.log(err)
                                res.status(400).send({ message: "Something went wrong. Please try again." })
                                return
                            }
                            db.query(`SELECT id FROM users WHERE email = '${req.body.email}'`, (err, id) => {
                                if (err) {
                                    console.log(err)
                                    res.status(400).send({ message: "Something went wrong. Please try again." })
                                    return
                                }
                                var token = jwt.sign({ id: id[0].id }, process.env.JWT_SECRET, {
                                    expiresIn: 80000 // expires in 20 something hours
                                });
                                let isAdmin = false
                                if (process.env.ADMIN_ACC_USERNAME === req.body.username && process.env.ADMIN_ACC_EMAIL === req.body.email) {
                                    isAdmin = true
                                }
                                res.status(201).send({ message: "Account Created Successfully", token: token, administrator: isAdmin });
                                sendEmail(req.body.email, `Hi ${req.body.username}, please verify your Ultimate Penny Trader account.`, createVerifyEmail(req.body.username, verifyHash))
                                return
                            })

                        });
                    });

                }
            });
        }
    });

});

router.post('/login', (req, res) => {
    db.query(`SELECT passhash, id FROM users WHERE email = '${req.body.usernameOrEmail}' OR username = '${req.body.usernameOrEmail}'`, (err, rows) => {
        if (err) {
            console.log(err)
            res.status(400).send({ message: "Something went wrong. Please try again." })
            return
        } else if (rows.length > 0) {
            console.log("found hash and id: " + rows[0])
            bcrypt.compare('' + req.body.password, rows[0].passhash, function (err, result) {
                if (err) {
                    console.log(err)
                    res.status(400).send({ message: "Something went wrong. Please try again." })
                    return
                }
                if (result) {
                    var token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, {
                        expiresIn: 80000 // expires in 3 hours
                    });
                    // Passwords match
                    let isAdmin = false
                    if (process.env.ADMIN_ACC_USERNAME === req.body.usernameOrEmail || process.env.ADMIN_ACC_EMAIL === req.body.usernameOrEmail) {
                        isAdmin = true
                    }
                    res.status(200).send({ message: "Logged In Successfully.", token: token, administrator: isAdmin })
                    return

                } else {
                    // Passwords don't match
                    res.status(400).send({ message: "Invalid password." })
                    return
                }
            });
        } else {
            res.status(400).send({ message: "Invalid email or usename." })
            return
        }
    })
})

//Update a user's saved shipping info 
router.put('/shipping', restricted, (req, res) => {
    console.log(JSON.stringify(req.body.shipping))
    //req.body.shipping
    db.query(`UPDATE users SET first_name = '${req.body.shipping.firstName}', last_name = '${req.body.shipping.lastName}', 
    address = '${req.body.shipping.address}', address_2 = '${req.body.shipping.address2}', city = '${req.body.shipping.city}', 
    state = '${req.body.shipping.state}', zip = '${req.body.shipping.zip}', phone = '${req.body.shipping.phone}' WHERE id = ${req.userId}`, (err, rows) => {
        if (err) {
            console.log(err)
            return res.status(400).send({ message: "Something went wrong. Please try again." })
        }
        return res.status(200).send({ message: "Successfully updated shipping address." })
    })
})

router.get('/shipping', restricted, (req, res) => {
    //req.body.shipping
    db.query(`SELECT first_name, last_name, address, address_2, city, state, zip, phone, email FROM users WHERE id = ${req.userId}`, (err, rows) => {
        if (err) {
            console.log(err)
            return res.status(400).send({ message: "Something went wrong. Please try again." })
        }
        return res.status(200).send({ data: rows })
    })
})

// get orders owned by requesting account
router.get('/orders', restricted, (req, res) => {
    console.log("working");
    db.query(`SELECT * FROM orders WHERE userid = ${req.userId}`, (err, rows) => {
        if (err) {
            console.log("SQL error", err)
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        console.log(rows);
        return res.status(200).send({ rows });
    })

})

// get order if owned by requesting account
router.get('/order', restricted, (req, res) => {

    let order;

    db.query(`SELECT * FROM orders WHERE id = ${req.query.id}`, (err, rows) => {
        if (err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        order = rows[0];
        if (order.userid != req.userId) {
            return res.status(403).send({ message: "Something went wrong. Please try again." })
        }
        db.query(`SELECT order_items.coinid FROM orders INNER JOIN order_items ON 
        orders.id=order_items.orderid WHERE orders.id = ${req.query.id}`, (err, rows2) => {

            let coinsQuery = ""

            rows2.forEach(coin => {
                console.log(coin.coinid)
                coinsQuery += " OR id = " + coin.coinid;
            });

            //remove first OR
            coinsQuery = coinsQuery.substring(4);


            console.log(`SELECT * FROM coins WHERE ${coinsQuery}`)
            db.query(`SELECT * FROM coins WHERE ${coinsQuery}`, (err, rows3) => {
                console.log(rows3)
                order.items = rows3;
                return res.status(200).send({ message: "Order delivered successfully.", order: order });
            })
        })
    })

})

router.get('/details', restricted, (req, res) => {
    db.query(`SELECT username, email FROM users WHERE id = ${req.userId}`, (err, rows) => {
        if (err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({ ...rows });
    })
})

router.put('/updatepassword', restricted, (req, res) => {

    if (!req.body.password) {
        return res.status(400).send({ message: "No password provided." })
    }
    if (!schema.validate("" + req.body.password)) {
        return res.status(400).send({ message: "Password is too weak. Must be at least 8 characters long, have at least one upper and one lower case letter, and have at least one number.", errors: schema.validate("" + req.body.password, { list: true }) })
    }

    bcrypt.hash('' + req.body.password, 10, function (err, hash) {
        db.query(`UPDATE users SET passhash = '${hash}' WHERE id = ${req.userId}`, (err, rows) => {
            if (err) {
                console.log(err)
                return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
            }
            return res.status(200).send({ message: "Success" });
        })
    })
})

router.put('/verify', (req, res) => {
    if (req.query.hash != null) {
        db.query(`SELECT * FROM users WHERE verify_hash='${req.query.hash}'`, (err, rows1) => {
            if(err || rows1.length == 0) {
                console.log("sql or no users with that hash found")
                console.log(JSON.stringify(rows1))
                return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
            }
            db.query(`UPDATE users SET verified = 1 WHERE id = ${rows1[0].id}`, (err, rows2) => {
                if(err) {
                    console.log("sqql2")
                    return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
                }
                return res.status(200).send({ message: "Success" });
            })
        })
    }
    else {
        console.log("no hash")
        return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
    }
})

module.exports = router