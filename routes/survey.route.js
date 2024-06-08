const express = require("express");
const SurveyContoller = require("../controller/survey.controller");
const authorize = require("../middlewares/authorize.middleware");
const uploadMiddleware = require("../middlewares/upload.middleware");
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router
  .get("/", [authorize()], SurveyContoller.getSurvey)
  .get("/getById/:id", [authorize()], SurveyContoller.getSurveyById)
  .get("/assignSurvey", [authorize()], SurveyContoller.getSurveyAssignedToUser)
  .post("/createSurvey", [authorize()], SurveyContoller.CreateSurvey)
  .post("/createSurveyQuestion/:surveyId", [authorize()], SurveyContoller.createQuestions)
  .post("/answer/:surveyId", [authorize()], upload.any(), SurveyContoller.createAnswer)
  .post(
    "/surveyImageAnswer/:surveyId",
    [authorize()],
    uploadMiddleware(),
    SurveyContoller.createSurveyAnswer
  );

module.exports = router;
