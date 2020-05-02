const mysql = require("mysql")

mysqlObj = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
    waitTimeout: 2
}

var mysqlConnection = mysql.createConnection(mysqlObj)

console.log(mysqlObj)

function handleDisconnect() {
    connection = mysql.createConnection(mysqlObj);

    connection.connect(function (err) {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
        else {
            console.log("Connected to MySQL successfully");
        }
    });
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            console.log("mysql error: ", err);
        }
    });
}

handleDisconnect();

module.exports = mysqlConnection;