var express = require("express")
var router = express.Router()

var db = require('../mysqlConfig');

const amountPerPage = 20;

router.get('/products', (req, res) => {
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

router.get('/search', (req, res) => {
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

router.get('/product', (req, res) => {
    console.log(req.query.ids)
    if(!req.query.ids) {
        return res.status(400).send({ message: "Something went wrong. Please try again.", error: "no product ids param sent" })
    }
    let idArray = JSON.parse(req.query.ids);
    let idQuery = "";
    idArray.forEach((id, index) => {
        if(index == 0) {
            idQuery += "id = " + id
        }else{
            idQuery += " OR id = " + id
        }
    });
    console.log(idQuery)
    db.query(
    `SELECT * FROM coins WHERE ${idQuery}`, (err, rows) => {
        if(err) {
            console.log(JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        console.log("Search: " + rows)
        res.status(200).send({data: rows});
    })
})

module.exports = router