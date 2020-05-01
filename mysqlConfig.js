const mysql = require("mysql")

mysqlObj = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
}

var mysqlConnection = mysql.createConnection(mysqlObj)

console.log(mysqlObj)

mysqlConnection.connect((err) => {
    if (!err) {
        console.log("Connected to MySQL successfully");
    } else {
        console.log("MySQL connection failed: " + err.message);
    }
})

mysqlConnection.on('error', function(err) {
    console.log("mysql error: ", err);
});

module.exports = mysqlConnection;