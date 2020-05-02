var express = require("express")
var router = express.Router()
const path = require("path");
const multer = require("multer");

var adminRestricted = require("../../middleware/adminRestricted")

var db = require('../../mysqlConfig');

const amountPerPage = 100;

router.get('/products', adminRestricted, (req, res) => {
    console.log("page number: " + req.query.pageNumber)
    if(!req.query.pageNumber) {
        req.query.pageNumber = 0
    }
    db.query(`SELECT * FROM coins WHERE id LIMIT ${req.query.pageNumber * amountPerPage}, ${req.query.pageNumber * amountPerPage + amountPerPage}`, (err, rows) => {
        if(err) {
            console.log(JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        res.status(200).send({data: rows});
    })
})

router.get('/search', adminRestricted, (req, res) => {
    if(!req.query.pageNumber) {
        req.query.pageNumber = 0
    }
    db.query(
    `SELECT * FROM coins WHERE name LIKE '%${req.query.searchTerm}%' OR image_name LIKE '%${req.query.searchTerm}%' 
    OR year LIKE '%${req.query.searchTerm}%' OR description LIKE '%${req.query.searchTerm}%' 
    LIMIT ${req.query.pageNumber * amountPerPage}, ${req.query.pageNumber * amountPerPage + amountPerPage}`, (err, rows) => {
        if(err) {
            console.log(JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        console.log("Search: " + rows)
        res.status(200).send({data: rows});
    })
})

const imageFilter = function (req, file, cb) {
    // accept image only
    if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
        console.log("NOT IMAGE")
        return cb(new Error('Only image files are allowed!'), false);
    }
    console.log("IMAGE")
    cb(null, true);
};

const storage = multer.diskStorage({
    destination: "./public/images/products",
    filename: function(req, file, cb){
       cb(null,"coin-" + Date.now() + "-" + path.basename(file.originalname, path.extname(file.originalname)) + path.extname(file.originalname));
    }
 });
 
 const upload = multer({
    storage: storage,
    limits:{fileSize: 100000000},
    fileFilter: imageFilter
 }).single("coinImage");

router.post('/add', adminRestricted, upload, (req, res) => {
    //req.body.data format:
    // {
    //     name: "name",
    //     image_name: "image name",
    //     year: 1990,
    //     price: 10000,
    //     description: "desc"
    // }

    if(!req.body){
        return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["no data sent"] })
    }
    if(!req.body.name || !req.body.year || !req.body.price){
        return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["data sent but missing an item"] })
    }
    let filename = "no-image.png"
    if(req.file) {
        filename = req.file.filename; 
    }
    if(!req.body.description){
        req.body.description = ""
    }
    db.query(`INSERT INTO coins (name, image_name, year, price, description) VALUES ('${req.body.name}', '${filename}', ${req.body.year}, ${req.body.price * 100}, '${req.body.description}')`, (err, rows) => {
        if(err) {
            console.log("SQL Error")
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({message: "Added product successfully."});
    })
})

router.post('/edit', adminRestricted, upload, (req, res) => {
    if(!req.body.id) {
        return res.status(400).send({ message: "Something went wrong. Please try again.", errors: ["no id to edit sent"] })
    }
    if(!req.body){
        return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["no data sent"] })
    }
    // if(!req.data.name || !req.data.image_name || !req.data.year || !req.data.price || !req.data.description){
    //     return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["data sent but missing an item"] })
    // }    let filename = "no-image.png"
    let valuesToUpdate = ""
    if (req.body.name) { 
        valuesToUpdate += `name = '${req.body.name}', `;
    }
    if (req.file && req.file.filename) {
        valuesToUpdate += `image_name = '${req.file.filename}', `
    }
    if (req.body.year) { 
        valuesToUpdate += `year = '${req.body.year}', `
    }
    if (req.body.price) {
        valuesToUpdate += `price = '${req.body.price}', `
    }
    if (req.body.description) {
        valuesToUpdate += `description = '${req.body.description}'`
    }

    db.query(`UPDATE coins SET ${valuesToUpdate} WHERE id = ${req.body.id}`, (err, rows) => {
        if(err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({message: "Edited product successfully."});
    })
})

router.delete('/delete', adminRestricted, (req, res) => {
    if(!req.query.id) {
        return res.status(400).send({ message: "Something went wrong. Please try again.", error: "no id provided"})
    }
    id = req.query.id
    db.query(`DELETE FROM coins WHERE id = ${id}`, (err, rows) => {
        if(err) {
            console.log("SQL error", err)
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({message: "Deleted product successfully."});
    })
})


module.exports = router