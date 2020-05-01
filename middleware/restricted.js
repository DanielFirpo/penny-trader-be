var jwt = require('jsonwebtoken');

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

      req.userId = decoded.id;
      next();
      
    });
}

module.exports = verifyToken;