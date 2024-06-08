const express = require("express");
const portalController = require("../controller/portal.controller");
const router = express.Router();

router.route("/").get(portalController.getPortal).post(portalController.createPortal);

router.route("/:portalId").patch(portalController.updatePortal).delete(portalController.deletePortal);

module.exports = router;
