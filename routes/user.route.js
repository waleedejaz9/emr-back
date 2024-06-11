const express = require("express");
const AuthController = require("../controller/auth.controller.js");
const authorize = require("../middlewares/authorize.middleware");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router
  .get("/getDashboardCount", [authorize()], AuthController.getUserCountByRoles)
  .get("/getAllUser", [authorize()], AuthController.getAllUser)
  .get("/userById/:userId", [authorize()], AuthController.getUserById)
  .post("/createMhc", [authorize()], upload.any(), AuthController.createMhc)
  .get("/getMhc", [authorize()], AuthController.getAllMhc)
  .get("/getMhc/:id", [authorize()], AuthController.getMhcById)
  .patch("/updateMhc/:id", [authorize()], upload.any(), AuthController.updateMhc)
  .post("/sign-up", [authorize()], AuthController.signUp)
  .post("/sign-in", AuthController.signIn)
  .patch("/updateUser/:id", [authorize()], AuthController.updateUser)
  .patch("/loginUpdateUser", [authorize()], AuthController.loginUpdateUser)
  .patch("/loginResetPassword", [authorize()], AuthController.resetPassword)
  .get("/getByRole/:roleId", [authorize()], AuthController.getUsersByRole)
  .post("/searchUser", [authorize()], AuthController.searchUser)
  .post("/sigupForRole", [authorize()], AuthController.signUpRole);

module.exports = router;
