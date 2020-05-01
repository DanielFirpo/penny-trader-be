var jwt = require('jsonwebtoken');

var db = require('../mysqlConfig');

//ADMIN_ACC_USERNAME
//ADMIN_ACC_EMAIL

//Make sure the user that is requesting this endpoint provided a valid token (is logged in).
function verifyToken(req, res, next) {
    var token = req.headers['x-access-token'];
    if (!token) {
      return res.status(403).send({message: 'No token provided.' });
    }
      
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err) {
        return res.status(500).send({message: 'Failed to authenticate token.'});
      }

      console.log("decoded: " + JSON.stringify(decoded));
      req.userId = decoded.id;
      
      db.query(`SELECT username, email FROM users WHERE id = ${req.userId}`, (err, rows) => {
          if(err) {
              console.log(err)
            return res.status(401).send({message: 'Invalid token.'});
          }
          if(rows[0].username == process.env.ADMIN_ACC_USERNAME && rows[0].email == process.env.ADMIN_ACC_EMAIL) {
              next()
          }
          else {
            return res.status(403).send({message: 'Not permitted.'});
          }
      })

    });
}

module.exports = verifyToken;