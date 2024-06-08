const jwt = require("jsonwebtoken");
const config = require("../config");
const { User } = require("../models/user.model");

const { jwtSecret } = config;

module.exports = function authorize() {
  return async (req, res, next) => {
    const success = false;
    const authHeader = req.header("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success, message: "No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = await jwt.verify(token, jwtSecret);
      const query = { _id: decoded?._id, isDeleted: false };
      const user = await User.findOne(query);

      if (!user) {
        return res.status(401).json({ success, message: "Invalid token." });
      }

      req.user = user;

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success, message: `${error.name}: ${error.message}.` });
    }
  };
};
