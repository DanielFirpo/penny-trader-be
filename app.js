var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var bodyParser = require("body-parser");

const dotenv = require('dotenv');
dotenv.config();

//routes
var auth = require("./routes/auth")
var admin = require("./routes/admin/admin")
var products = require("./routes/products")
var payment = require("./routes/payment")

var cors = require('cors');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors({origin:true,credentials: true}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser())
app.use(bodyParser.json({limit:'200000mb'})); 
app.use(bodyParser.urlencoded({extended:true, limit:'200000mb'}));
app.use(express.static(path.join(__dirname, 'public')));

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// console.log("STOCK: " + JSON.parse(fs.readFileSync(path.join(__dirname, '1078293.json'))).stock )

app.get('/', (req, res) => res.send('Penny Trader API'))

// function proctectRoute(req,res,next){
//   // if user exists the token was sent with the request
//   if(req.user){
//    //if user exists then go to next middleware
//      next();
//   }
// // token was not sent with request send error to user
//   else{
//      res.status(500).json({error:'login is required'});
//   }
// }

app.use("/", auth)
app.use("/admin", admin)
app.use("/products", products)
app.use("/payment", payment)

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.log(err.message)

  // render the error page
  res.status(err.status || 500);
  res.send("Error");
  // res.render('error');
});

module.exports = app;
