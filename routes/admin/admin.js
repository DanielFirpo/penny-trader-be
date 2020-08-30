var express = require("express")
var router = express.Router()

var adminRestricted = require("../../middleware/adminRestricted")

var db = require('../../mysqlConfig');

var s3Upload = require('../../s3Config');

const multer = require("multer");

// filename: function(req, file, cb){
//     cb(null,"coin-" + Date.now() + "-" + path.basename(file.originalname, path.extname(file.originalname)) + path.extname(file.originalname));
//  }

let files = [];

router.post('/uploadimage', adminRestricted, (req, res) => {
    s3Upload(req, res, function (err) {
        if(req.file) {
            files.push({ front: req.body.front, id: req.body.uploadID, file: req.file })
            console.log("File recieved: " + JSON.stringify({ front: req.body.front, id: req.body.uploadID, file: req.file }))
            return res.status(200).send({ message: "File recieved successfully." });
        }
        return res.status(200).send({ message: "No file." });
    })
})

router.post('/add', adminRestricted, multer().fields([]), (req, res) => {

    // console.log("files:")
    // console.log(JSON.stringify(req.images));
    // let fileArray = req.files,
    //     fileLocation;
    // const images = [];
    // for (let i = 0; i < fileArray.length; i++) {
    //     fileLocation = fileArray[i].location;
    //     console.log('filenm', fileLocation);
    //     images.push(fileLocation)
    // }
    // console.log("images")
    // console.log(JSON.stringify(images))

    // if (err) {
    //     console.log(err)
    //     return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["s3 error"] })
    // }
    //req.body.data format:
    // {
    //     name: "name",
    //     image_name: "image name",
    //     year: 1990,
    //     price: 10000,
    //     description: "desc"
    // }

    if (!req.body) {
        console.log("no body")
        return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["no data sent"] })
    }
    console.log(req.body)
    if (!req.body.name || !req.body.year || !req.body.price || !req.body.status || !req.body.rating || !req.body.manufacturer) {
        console.log(req.body.name + " " + !req.body.year  + " " +  !req.body.price  + " " +  !req.body.status  + " " +  !req.body.rating  + " " +  !req.body.manufacturer)
        return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["data sent but missing an item"] })
    }
    if (req.body.status != 0 && req.body.status != 1 && req.body.status != 2) {
        req.body.status = 0;
    }

    let frontFilename = "no-image.png"
    let backFilename = "no-image.png"
    files.forEach(file => {
        if(file.uploadID === req.body.uploadID){
            if(file.front) {
                console.log("front file " + JSON.stringify(file.file))
                frontFilename = file.file.filename;
            }
            else if (!file.front) {
                console.log("back file " + JSON.stringify(file.file))
                backFilename = file.file.filename;
            }
        }
    });

    // let frontFilename = "no-image.png"
    // if (images[0]) {
    //     frontFilename = images[0];
    // }
    // let backFilename = "no-image.png"
    // if (images[1]) {
    //     backFilename = images[1];
    // }
    if (!req.body.description) {
        req.body.description = ""
    }
    db.query(`INSERT INTO coins (name, front_image_name, back_image_name, year, price, description, status, rating, manufacturer) VALUES ('${req.body.name}', '${frontFilename}', '${backFilename}', ${req.body.year}, ${req.body.price * 100}, '${req.body.description}', ${parseInt(req.body.status)}, ${parseInt(req.body.rating)}, ${parseInt(req.body.manufacturer)})`, (err, rows) => {
        if (err) {
            console.log("SQL Error", err)
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({ message: "Added product successfully." });
    })
})

router.post('/edit', adminRestricted, (req, res) => {
    singleUpload(req, res, function (err) {

        if (err) {
            console.log(err)
            return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["s3 error"] })
        }

        if (!req.body || !req.body.status) {
            return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["no data sent"] })
        }
        if (!req.body.id) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: ["no id to edit sent"] })
        }
        if (req.body.status != 0 && req.body.status != 1 && req.body.status != 2) {
            req.body.status = 0;
        }
        // if(!req.data.name || !req.data.image_name || !req.data.year || !req.data.price || !req.data.description){
        //     return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["data sent but missing an item"] })
        // }    let filename = "no-image.png"
        let valuesToUpdate = ""
        if (req.body.name) {
            valuesToUpdate += `name = '${req.body.name}'`;
        }
        if (req.file) {
            valuesToUpdate += `, image_name = '${req.file.location}'`
        }
        if (req.body.year) {
            valuesToUpdate += `, year = '${req.body.year}'`
        }
        if (req.body.price) {
            valuesToUpdate += `, price = '${req.body.price * 100}'`
        }
        if (req.body.description) {
            valuesToUpdate += `, description = '${req.body.description}'`
        }
        else {
            valuesToUpdate += `, description = ''`
        }
        valuesToUpdate += `, status = ${req.body.status}`
        valuesToUpdate += `, rating = ${req.body.rating}`
        valuesToUpdate += `, manufacturer = ${req.body.manufacturer}`

        db.query(`UPDATE coins SET ${valuesToUpdate} WHERE id = ${req.body.id}`, (err, rows) => {
            if (err) {
                console.log("SQL ERROR " + err, "values to update: " + valuesToUpdate)
                return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
            }
            return res.status(200).send({ message: "Edited product successfully." });
        })
    })
})

router.delete('/delete', adminRestricted, (req, res) => {
    if (!req.query.id) {
        return res.status(400).send({ message: "Something went wrong. Please try again.", error: "no id provided" })
    }
    id = req.query.id
    db.query(`DELETE FROM coins WHERE id = ${id}`, (err, rows) => {
        if (err) {
            console.log("SQL error", err)
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({ message: "Deleted product successfully." });
    })
})

// get orders, filtered by status (defaults to 0, "placed") and by optional searchTerm
router.get('/orders', adminRestricted, (req, res) => {
    //req.query.status
    //req.query.searchTerm
    if (req.query.status != 0 && req.query.status != 1 && req.query.status != 2) {
        req.query.status = 0;
    }
    db.query(`SELECT * FROM orders WHERE status = ${req.query.status}`, (err, rows) => {
        if (err) {
            console.log("SQL error", err)
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        console.log(rows);
        return res.status(200).send({ message: "Orders delivered successfully.", orders: rows });
    })
})

// get order
router.get('/order', adminRestricted, (req, res) => {

    let order;

    db.query(`SELECT * FROM orders WHERE id = ${req.query.id}`, (err, rows) => {
        if (err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        order = rows[0];
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

router.get('/searchorders', adminRestricted, (req, res) => {
    //req.query.status
    //req.query.searchTerm
    if (req.query.status != 0 && req.query.status != 1 && req.query.status != 2) {
        req.query.status = 0;
    }
    db.query(`SELECT * FROM orders WHERE status = ${req.query.status} AND first_name LIKE '%${req.query.searchTerm}%' 
    OR last_name LIKE '%${req.query.searchTerm}%' OR address LIKE '%${req.query.searchTerm}%' OR address_2 LIKE '%${req.query.searchTerm}%' 
    OR city LIKE '%${req.query.searchTerm}%' OR state LIKE '%${req.query.searchTerm}%' OR zip LIKE '%${req.query.searchTerm}%' 
    OR phone LIKE '%${req.query.searchTerm}%' OR email LIKE '%${req.query.searchTerm}%'`, (err, rows) => {
        if (err) {
            console.log("SQL error", err)
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        console.log(rows);
        return res.status(200).send({ message: "Orders delivered successfully.", orders: rows });
    })
})

router.put('/orderstatus', adminRestricted, (req, res) => {
    //req.body.status
    //req.query.id

    if (req.body.status != 0 && req.body.status != 1 && req.body.status != 2 || !req.query.id) {
        return res.status(400).send({ message: "Something went wrong. Please try again.", errors: "Invalid status sent, or no id param" })
    }
    db.query(`UPDATE orders SET status = ${req.body.status} WHERE id = ${req.query.id}`, (err, rows) => {
        if (err) {
            console.log("SQL error", err)
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        console.log(rows);
        return res.status(200).send({ message: "Orders delivered successfully.", orders: rows });
    })
})


router.post('/storesettings', adminRestricted, (req, res) => {

    let query = ""

    if (req.body.tax_rate) {
        query += "tax_rate = " + req.body.tax_rate + (req.body.shipping_fee ? ", " : "");
    }

    if (req.body.shipping_fee) {
        query += "shipping_fee = " + req.body.shipping_fee;
    }

    if (!req.body.tax_rate && !req.body.shipping_fee) {
        console.log("here")
        return res.status(400).send({ message: "Something went wrong. Please try again." })
    }

    console.log(`UPDATE store_settings SET ${query}`)
    db.query(`UPDATE store_settings SET ${query}`, (err, rows) => {
        if (err) {
            console.log("sql")
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({ message: "Successfully updated store settings." });
    })
})

router.get('/storesettings', (req, res) => {
    db.query('SELECT * FROM store_settings', (err, rows) => {
        if (err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({ ...rows[0] });
    })
})

module.exports = router