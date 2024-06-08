const express = require("express");
const ModuleController = require("../controller/module.controller");
const authorize = require("../middlewares/authorize.middleware");
const router = express.Router();

router
  .get("/", [authorize()], ModuleController.getAllModuleType)
  .post("/", [authorize()], ModuleController.createModuleType);

module.exports = router;
