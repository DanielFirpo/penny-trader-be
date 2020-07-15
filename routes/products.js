var express = require("express")
var router = express.Router()

var db = require('../mysqlConfig');

var adminRestricted = require("../middleware/adminRestricted")

const amountPerPage = 20;

router.get('/products', (req, res) => {
    console.log("page number: " + req.query.pageNumber)
    if (!req.query.pageNumber) {
        req.query.pageNumber = 0
    }
    db.query(`SELECT * FROM coins WHERE status = 1 AND id LIMIT ${req.query.pageNumber * amountPerPage}, ${req.query.pageNumber * amountPerPage + amountPerPage}`, (err, rows) => {
        if (err) {
            console.log("ERROR " + JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        res.status(200).send({ data: rows });
    })
})

//get the amount of pages
router.get('/productpages', (req, res) => {

    db.query(`SELECT * FROM coins`, (err, rows) => {
        if (err) {
            console.log("ERROR " + JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        res.status(200).send({ pages: Math.ceil(rows.length / amountPerPage) });
    })

})

router.get('/adminproducts', adminRestricted, (req, res) => {
    console.log("page number: " + req.query.pageNumber)
    if (!req.query.pageNumber) {
        req.query.pageNumber = 0
    }
    db.query(`SELECT * FROM coins WHERE id LIMIT ${req.query.pageNumber * amountPerPage}, ${req.query.pageNumber * amountPerPage + amountPerPage}`, (err, rows) => {
        if (err) {
            console.log("ERROR " + JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        res.status(200).send({ data: rows });
    })
})

router.get('/search', (req, res) => {

    let filter;

    if (req.query.filter) {
        try {

            filter = JSON.parse(req.query.filter);

            if (filter.minPrice != "") {
                filter.minPrice = parseInt(filter.minPrice)
            }
            else {
                filter.minPrice = 0
            }

            if (filter.maxPrice != "") {
                filter.maxPrice = parseInt(filter.maxPrice)
            }
            else {
                filter.maxPrice = 100000;//something big so if they don't specificy upper bounds it will include all
            }

            if (filter.maxYear != "") {
                filter.minYear = parseInt(filter.minYear)
            }
            else {
                filter.minYear = 0
            }

            if (filter.maxYear != "") {
                filter.maxYear = parseInt(filter.maxYear)
            }
            else {
                filter.maxYear = 100000;//something big so if they don't specificy upper bounds it will include all
            }
        }
        catch {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
    }
    else {
        return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
    }

    if (!req.query.pageNumber) {
        req.query.pageNumber = 0
    }

    db.query(
        `SELECT * FROM coins WHERE (name LIKE '%${filter.searchTerm}%' 
    OR year LIKE '%${filter.searchTerm}%' OR description LIKE '%${filter.searchTerm}%') AND status = 1
    AND year >= ${filter.minYear} AND year <= ${filter.maxYear} AND price >= ${filter.minPrice * 100} AND price <= ${filter.maxPrice * 100}
    LIMIT ${req.query.pageNumber * amountPerPage}, ${req.query.pageNumber * amountPerPage + amountPerPage}`, (err, rows) => {
        if (err) {
            console.log(JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        console.log("Search: " + rows)
        res.status(200).send({ data: rows });
    })
})

router.get('/adminsearch', adminRestricted, (req, res) => {

    
    let filter;

    if (req.query.filter) {
        try {

            filter = JSON.parse(req.query.filter);

            if (filter.minPrice != "") {
                filter.minPrice = parseInt(filter.minPrice)
            }
            else {
                filter.minPrice = 0
            }

            if (filter.maxPrice != "") {
                filter.maxPrice = parseInt(filter.maxPrice)
            }
            else {
                filter.maxPrice = 100000;//something big so if they don't specificy upper bounds it will include all
            }

            if (filter.maxYear != "") {
                filter.minYear = parseInt(filter.minYear)
            }
            else {
                filter.minYear = 0
            }

            if (filter.maxYear != "") {
                filter.maxYear = parseInt(filter.maxYear)
            }
            else {
                filter.maxYear = 100000;//something big so if they don't specificy upper bounds it will include all
            }

            if (filter.status == undefined) {
                console.log("no filter sent")
                filter.status = 1;//listed
            }

        }
        catch {
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
    }
    else {
        return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
    }

    if (!req.query.pageNumber) {
        req.query.pageNumber = 0
    }

    db.query(
        `SELECT * FROM coins WHERE (name LIKE '%${filter.searchTerm}%' 
    OR year LIKE '%${filter.searchTerm}%' OR description LIKE '%${filter.searchTerm}%') AND status = ${filter.status}
    AND year >= ${filter.minYear} AND year <= ${filter.maxYear} AND price >= ${filter.minPrice * 100} AND price <= ${filter.maxPrice * 100}
    LIMIT ${req.query.pageNumber * amountPerPage}, ${req.query.pageNumber * amountPerPage + amountPerPage}`, (err, rows) => {
        if (err) {
            console.log(JSON.stringify(err))
            return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
        }
        console.log("Search: " + rows)
        res.status(200).send({ data: rows });
    })

})

router.get('/product', (req, res) => {
    console.log(req.query.ids)
    if (!req.query.ids) {
        return res.status(400).send({ message: "Something went wrong. Please try again.", error: "no product ids param sent" })
    }
    let idArray = JSON.parse(req.query.ids);
    let idQuery = "";
    idArray.forEach((id, index) => {
        if (index == 0) {
            idQuery += "id = " + id
        } else {
            idQuery += " OR id = " + id
        }
    });
    console.log(`SELECT * FROM coins WHERE (${idQuery}) AND status = 1`)
    db.query(
        `SELECT * FROM coins WHERE (${idQuery}) AND status = 1`, (err, rows) => {
            if (err) {
                console.log(JSON.stringify(err))
                return res.status(400).send({ message: "Something went wrong. Please try again.", errors: err })
            }
            console.log("Search: " + JSON.stringify(rows))
            res.status(200).send({ data: rows });
        })
})

module.exports = router