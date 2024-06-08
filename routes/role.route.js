const express = require("express");
const RoleController = require("../controller/role.controller");
const router = express.Router();

router.route("/").get(RoleController.getRoles).post(RoleController.createRole);

router.route("/:roleId").patch(RoleController.updateRole).delete(RoleController.deleteRole);

module.exports = router;
