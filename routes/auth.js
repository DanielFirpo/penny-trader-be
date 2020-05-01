var express = require("express")
var router = express.Router()

var db = require('../mysqlConfig');

const bcrypt = require('bcrypt');

// process.env.JWT_SECRET
var jwt = require('jsonwebtoken');

var validator = require('validator');

var passwordValidator = require('password-validator');

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

                    //and finally:
                    bcrypt.hash('' + req.body.password, 10, function (err, hash) {
                        // Store new user info now that the password has finished hashing
                        db.query(`INSERT INTO users(passhash, email, username) VALUES('${hash}', '${req.body.email}', '${req.body.username}')`, (err) => {
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
                                var token = jwt.sign({ id: id[0].id}, process.env.JWT_SECRET, {
                                    expiresIn: 10800 // expires in 3 hours
                                });
                                let isAdmin = false
                                if(process.env.ADMIN_ACC_USERNAME === req.body.username && process.env.ADMIN_ACC_EMAIL === req.body.email) {
                                    isAdmin = true
                                }
                                res.status(201).send({ message: "Account Created Successfully", token: token, administrator: isAdmin });
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
                        expiresIn: 10800 // expires in 3 hours
                    });
                    // Passwords match
                    let isAdmin = false
                    if(process.env.ADMIN_ACC_USERNAME === req.body.usernameOrEmail || process.env.ADMIN_ACC_EMAIL === req.body.usernameOrEmail) {
                        isAdmin = true
                    }
                    res.status(200).send({ message: "Logged In Successfully.", token: token, administrator: isAdmin})
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

module.exports = router