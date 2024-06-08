const bcrypt = require("bcrypt");

const BcryptUtil = {
  async getHash({ data, saltRounds = 10 }) {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashed = await bcrypt.hash(data, salt);

    return hashed;
  },
};

module.exports = BcryptUtil;
