const express = require("express");
const AuthController = require("../controller/auth.controller.js");
const authorize = require("../middlewares/authorize.middleware");

const router = express.Router();

router
  .get("/getAllUser", [authorize()], AuthController.getAllUser)
  .get("/userById/:userId", [authorize()], AuthController.getUserById)
  .post("/createMhc", [authorize()], AuthController.createMhc)
  .get("/getMhc", [authorize()], AuthController.getAllMhc)
  .get("/getMhc/:id", [authorize()], AuthController.getMhcById)
  .patch("/updateMhc/:id", [authorize()], AuthController.updateMhc)
  .post("/sign-up", [authorize()], AuthController.signUp)
  .post("/sign-in", AuthController.signIn)
  .patch("/updateMhc/:id", [authorize()], AuthController.updateMhc)
  .patch("/loginUpdateUser", [authorize()], AuthController.loginUpdateUser)
  .patch("/loginResetPassword", [authorize()], AuthController.resetPassword)
  .get("/getByRole/:roleId", [authorize()], AuthController.getUsersByRole)
  .post("/searchUser", [authorize()], AuthController.searchUser)
  .post("/sigupForRole", [authorize()], AuthController.signUpRole);

module.exports = router;
