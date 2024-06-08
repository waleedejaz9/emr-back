const mongoose = require("mongoose");
const { User } = require("../models/user.model");

const surveySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
    },
    assignTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestionSurvey",
      },
    ],
  },
  { timestamps: true }
);

const questionSurveySchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    assignTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    type: {
      type: String,
      required: true,
      enum: [
        "SingleLineText",
        "MultiLineText",
        "MCQ",
        "Radio",
        "Checkbox",
        "Dropdown",
        "instrunctionalText",
        "MultiSelect",
        "Date/Time Picker",
        "E-Sign Field",
      ],
    },
    statement: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      default: [],
      required: true,
    },

    answers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        answer: String,
      },
    ],
    required: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const answerSurveySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionSurvey",
      required: true,
    },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

const eSignNatureSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey",
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuestionSurvey",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answer: { type: String, required: true },
});

const Survey = mongoose.model("Survey", surveySchema);
const QuestionSurvey = mongoose.model("QuestionSurvey", questionSurveySchema);
const AnswerSurvey = mongoose.model("AnswerSurvey", answerSurveySchema);
const Esign = mongoose.model("eSignSurvey", eSignNatureSchema);

module.exports = { QuestionSurvey, Survey, AnswerSurvey, Esign };
