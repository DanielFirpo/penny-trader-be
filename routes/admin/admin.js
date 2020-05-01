var express = require("express")
var router = express.Router()

var adminRestricted = require("../../middleware/adminRestricted")

var db = require('../../mysqlConfig');

router.get('/products', adminRestricted, (req, res) => {
    if(!req.body.pageNumber) {
        req.body.pageNumber = 0
    }
    db.query(`SELECT * FROM coins WHERE id BETWEEN ${req.body.pageNumber * 100} AND ${req.body.pageNumber * 100 + 100}`, (err, rows) => {
        if(err) {
            console.log(JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        res.status(200).send({data: rows});
    })
})

router.get('/search', adminRestricted, (req, res) => {
    
    db.query(
    `SELECT * FROM coins WHERE name LIKE '%${req.body.searchTerm}%' OR image_name LIKE '%${req.body.searchTerm}%' 
    OR year LIKE '%${req.body.searchTerm}%' OR description LIKE '%${req.body.searchTerm}%'`, (err, rows) => {
        if(err) {
            console.log(JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        res.status(200).send({data: rows});
    })
})

router.post('/add', adminRestricted, (req, res) => {
    //req.body.data format:
    // {
    //     name: "name",
    //     image_name: "image name",
    //     year: 1990,
    //     price: 10000,
    //     description: "desc"
    // }
    console.log(req)
    if(!req.body.data){
        return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["no data sent"] })
    }
    if(!req.body.data.name || !req.body.data.image_name || !req.body.data.year || !req.body.data.price || !req.body.data.description){
        return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["data sent but missing an item"] })
    }
    db.query(`INSERT INTO coins (name, image_name, year, price, description) VALUES ('${req.body.data.name}', '${req.body.data.image_name}', ${req.body.data.year}, ${req.body.data.price}, '${req.body.data.description}')`, (err, rows) => {
        if(err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({message: "Added product successfully."});
    })
})

router.post('/edit', adminRestricted, (req, res) => {
    if(!req.body.id) {
        return res.status(400).send({ message: "Something went wrong. Please try again.", errors: ["no id to edit sent"] })
    }
    if(!req.body.data){
        return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["no data sent"] })
    }
    // if(!req.data.name || !req.data.image_name || !req.data.year || !req.data.price || !req.data.description){
    //     return res.status(400).send({ message: "Something went wrong. Make sure you filled out every form field.", errors: ["data sent but missing an item"] })
    // }
    let valuesToUpdate = ""
    if (req.body.data.name) { 
        valuesToUpdate += `name = '${req.body.data.name}', `;
    }
    if (req.body.data.image_name) {
        valuesToUpdate += `image_name = '${req.body.data.image_name}', `
    }
    if (req.body.data.year) { 
        valuesToUpdate += `year = '${req.body.data.year}', `
    }
    if (req.body.data.price) {
        valuesToUpdate += `price = '${req.body.data.price}', `
    }
    if (req.body.data.description) {
        valuesToUpdate += `description = '${req.body.data.description}'`
    }

    db.query(`UPDATE coins SET ${valuesToUpdate} WHERE id = ${req.body.id}`, (err, rows) => {
        if(err) {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        return res.status(200).send({message: "Edited product successfully."});
    })
})


module.exports = router