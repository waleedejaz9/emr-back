const { User, Role } = require("../models/user.model");
const { Survey, QuestionSurvey, AnswerSurvey, Esign } = require("../models/survey.model");
const mongoose = require("mongoose");
const getUserIdFromToken = require("../utils/getUserIdFromToken.util");
const path = require("path");

const SurveyController = {
  async getSurvey(req, res) {
    try {
      const { user } = req;

      const superAdminId = new mongoose.Types.ObjectId("662c05660a775f5b72ebe9ba");

      if (user.roles.equals(superAdminId)) {
        const survey = await Survey.find().populate("questions").populate("createdBy");
        return res.status(200).json({ success: true, length: survey.length, data: survey });
      } else {
        const survey = await Survey.find({ company: user.company })
          .populate("questions")
          .populate("createdBy");

        return res.status(200).json({ success: true, length: survey.length, data: survey });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
  async getSurveyById(req, res) {
    try {
      const { user } = req;
      const surveyId = req.params.id;
      const [survey] = await Survey.find({ _id: surveyId, company: user.company })
        .populate("questions")
        .populate("createdBy");
      if (!survey) {
        return res.status(400).json({ success: false, message: "survey not found." });
      }

      const questionsWithAnswers = await Promise.all(
        (survey.questions || []).map(async (question) => {
          const answers = await AnswerSurvey.find({ questionId: question._id });
          return {
            ...question.toObject(),
            answers: answers,
          };
        })
      );

      const transformedModule = {
        ...survey.toObject(),
        questions: questionsWithAnswers,
      };

      return res.status(200).json({ success: true, data: transformedModule });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async CreateSurvey(req, res) {
    try {
      const { name, description } = req.body;
      const { user } = req;

      if (!user) {
        return res.status(400).json({ success: false, message: "User not found." });
      }
      if (!user.roles) {
        return res.status(400).json({ success: false, message: "User role not defined." });
      }

      // const superAdminId = new mongoose.Types.ObjectId("662c05660a775f5b72ebe9ba");

      const surveyData = {
        userId: user._id,
        name,
        description,
        createdBy: user._id,
      };

      // if (!user.roles.equals(superAdminId)) {
      //   surveyData.company = user.company;
      // }

      const survey = await Survey.create(surveyData);

      return res.status(200).json({
        success: true,
        message: "Survey created successfully.",
        data: survey,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async createQuestions(req, res) {
    let session = await mongoose.startSession();
    session.startTransaction();
    try {
      const surveyId = req.params.surveyId;
      const { user } = req;

      const { assignTo, questions } = req.body;

      const survey = await Survey.findById(surveyId);
      const usersAssign = await User.find({ _id: { $in: assignTo } });

      if (usersAssign.length !== assignTo.length) {
        return res.status(400).json({ success: false, message: "One or more assigned users not found." });
      }
      if (!user) {
        return res.status(400).json({ success: false, message: "User not found." });
      }

      if (!survey) {
        return res.status(400).json({ success: false, message: "survey not found." });
      }

      const createdQuestions = questions.map((question) => ({
        surveyId,
        assignTo: assignTo,
        statement: question.statement,
        type: question?.type,
        required: question?.required,
        options: question?.options,
      }));
      const createdQuestionDocuments = await QuestionSurvey.create(createdQuestions, { session });

      const createdQuestionIds = createdQuestionDocuments.map((question) => question._id);

      survey.questions = survey.questions.concat(createdQuestionIds);
      survey.assignTo = assignTo;
      survey.company = usersAssign[0].company;

      await survey.save({ session });

      await session.commitTransaction();
      session.endSession();

      const allQuestions = await QuestionSurvey.find({ surveyId });

      return res.status(200).json({
        success: true,
        message: "Questions created successfully.",
        length: allQuestions.length,
        data: allQuestions,
      });
    } catch (err) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async createAnswer(req, res) {
    try {
      const surveyId = req.params.surveyId;
      const { user } = req;
      const answer = req.body;

      const answers = Object.keys(answer)
        .reduce((acc, key) => {
          const match = key.match(/answers\[(\d+)\]\.(\w+)/);
          if (match) {
            const index = parseInt(match[1], 10);
            const field = match[2];
            if (!acc[index]) {
              acc[index] = {};
            }
            acc[index][field] = answer[key];
          }
          return acc;
        }, [])
        .filter((item) => item !== undefined);

      const survey = await Survey.findById(surveyId);

      if (!survey) {
        return res.status(400).json({ success: false, message: "Survey not found." });
      }

      const questionIds = answers.map((answer) => answer.questionId);

      const existingAnswers = await AnswerSurvey.find({
        surveyId,
        userId: user._id,
        questionId: { $in: questionIds },
        type: { $ne: "E-Sign Field" },
      });

      if (existingAnswers.length > 0) {
        return res.status(400).json({
          success: false,
          message: "User has already answered one or more of these questions.",
        });
      }

      const createdAnswers = await Promise.all(
        answers.map(async (answer, index) => {
          let answerData = {
            surveyId,
            userId: user._id,
            questionId: answer.questionId,
            answer: answer.answer,
            type: answer.type,
          };
          if (answer.type === "E-Sign Field" && req.files) {
            const file = req.files.find((file) => file.fieldname === `answers[${index}].answer`);
            if (file) {
              const fileUrl = await uploadToAzure(file);
              answerData.answer = fileUrl;
            }
          }

          return answerData;
        })
      );

      const answerAdded = await AnswerSurvey.insertMany(createdAnswers);

      return res.status(200).json({
        success: true,
        message: "Answer created successfully.",
        data: answerAdded,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async getSurveyAssignedToUser(req, res) {
    try {
      const { user } = req;

      const survey = await Survey.find({ assignTo: { $in: [user._id] } })
        .populate("questions")
        .populate("createdBy");

      return res.status(200).json({
        success: true,
        message: "Survey found.",
        length: survey.length,
        data: survey,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async createSurveyAnswer(req, res) {
    // try {
    const surveyId = req.params.surveyId;
    const { user } = req;
    const { answer } = req.body;

    console.log({ answer: req.body });

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(400).json({ success: false, message: "survey not found." });
    }

    const existingEsign = await Esign.findOne({
      surveyId,
      userId: user._id,
      questionId: answer.questionId,
    });
    const filePath = path.resolve(__dirname, "uploads", req?.file?.filename || "upload");
    let createdAnswer;
    if (existingEsign) {
      existingEsign.answer = filePath;
      await existingEsign.save();

      createdAnswer = existingEsign;
    } else {
      // Create new E-Sign field
      const filePath = path.resolve(__dirname, "uploads", req.file.filename || "UPLOAD");

      createdAnswer = await Emodsign.create({
        surveyId,
        userId: user._id,
        questionId: answer.questionId,
        answer: filePath,
        type: "E-Sign Field",
      });
    }

    // Insert in the survey answer
    const newAnswer = new AnswerSurvey({
      surveyId,
      userId: user._id,
      questionId: answer.questionId,
      answer: createdAnswer.answer, // Assuming the file path is stored in the answer field of E-Sign
      type: "E-Sign Field",
    });

    await newAnswer.save();

    return res.status(200).json({
      success: true,
      message: "Answer created/updated successfully.",
      data: createdAnswer,
    });
    // } catch (err) {
    //   return res.status(500).json({ success: false, message: err.message });
    // }
  },
};

module.exports = SurveyController;
