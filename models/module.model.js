const mongoose = require("mongoose");
const { User } = require("../models/user.model");

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModuleType",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
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
        ref: "Question",
      },
    ],
  },
  { timestamps: true }
);

const moduleTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const questionSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
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

const answerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
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
  },
  { timestamps: true }
);

const eSignNatureSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answer: { type: String, required: true },
});

const ModuleType = mongoose.model("ModuleType", moduleTypeSchema);
const Module = mongoose.model("Module", moduleSchema);
const Question = mongoose.model("Question", questionSchema);
const Answer = mongoose.model("Answer", answerSchema);
const Esign = mongoose.model("e-sign", eSignNatureSchema);

module.exports = { Question, Module, Answer, ModuleType, Esign };
