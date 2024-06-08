const express = require("express");
const PermissionController = require("../controller/permission.controller");
const authorize = require("../middlewares/authorize.middleware");

const router = express.Router();

router
  .post("/grantPermission/:portalId", [authorize()], PermissionController.grantPermission)
  // .get("/grantPermission", [authorize()], PermissionController.getPermissionById)
  .get("/", [authorize()], PermissionController.getGrantedPermission);

module.exports = router;
