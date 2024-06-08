const dotenv = require("dotenv");

dotenv.config();

const dbUrl = (process.env.DB_URL || "")
  .replace("DB_NAME", process.env.DB_NAME)
  .replace("DB_USERNAME", process.env.DB_USERNAME)
  .replace("DB_PASSWORD", process.env.DB_PASSWORD);

const config = {
  dbUrl,

  port: process.env.PORT,
  env: process.env.NODE_ENV,
  characters: process.env.CHARACTERS,
  azureKey : process.env.AZURE_KEY,
  azureContainerName: process.env.AZURE_CONTAINER_NAME,
  appUrl: process.env.APP_URL,
  baseUrl: process.env.BASE_URL,
  whiteList: process.env.WHITELIST,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
};

module.exports = config;
