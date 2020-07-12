const mysql = require("mysql")

mysqlConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
    connectTimeout: 500000,
    port: process.env.MYSQL_PORT,
    // debug: true
}

// console.log(mysqlConfig)

var pool = mysql.createPool(mysqlConfig)

// function handleDisconnect() {
//     connection = mysql.createConnection(mysqlObj);

//     connection.connect(function (err) {
//         if (err) {
//             console.log('error when connecting to db:');
//             console.log(err.code);
//             console.log("Fatal: " + err.fatal);
//             console.log(err.sql);
//             console.log(err.sqlMessage);
//             setTimeout(handleDisconnect, 2000);
//         }
//         else {
//             console.log("Connected to MySQL successfully");
//         }
//     });
//     connection.on('error', function (err) {
//         console.log('db error', err);
//         if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//             handleDisconnect();
//         } else {
//             console.log("mysql error: ", err);
//         }
//     });
// }

// handleDisconnect();

// Attempt to catch disconnects 
pool.on('connection', function (connection) {
    console.log('DB Connection established');
  
    connection.on('error', function (err) {
      console.error(new Date(), 'MySQL error', err.code);
    });
    connection.on('close', function (err) {
      console.error(new Date(), 'MySQL close', err);
    });
  
  });
  
  
  module.exports = pool;