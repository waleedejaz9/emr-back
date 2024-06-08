const jwt = require("jsonwebtoken");
const config = require("../config");
function getUserIdFromToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, config.jwtSecret);
    return decodedToken._id;
    return null;
  }
}

module.exports = getUserIdFromToken;
