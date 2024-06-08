const express = require("express");
const ModuleController = require("../controller/module.controller");
const authorize = require("../middlewares/authorize.middleware");
const router = express.Router();
const uploadMiddleware = require("../middlewares/upload.middleware");
// const upload.any() require("../middlewares/uploadImage.middleware");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router
  .get("/", [authorize()], ModuleController.getModules)
  .get("/:moduleId", [authorize()], ModuleController.getModulesById)

  .get("/assignedModule/:type", [authorize()], ModuleController.getModulesAssignedToUser)
  .get("/moduleByType/:type", [authorize()], ModuleController.getModuleByType)

  .get("/:id", [authorize()], ModuleController.getModulesById)
  .post("/createModule", [authorize()], ModuleController.CreateModule)
  .post("/createQuestion/:moduleId", [authorize()], ModuleController.createQuestions)
  .post("/answer/:moduleId", authorize(), upload.any(), ModuleController.createAnswer)
  .post("/imageAnswer/:moduleId", [authorize()], upload.any(), ModuleController.createModuleAnswer);

module.exports = router;
