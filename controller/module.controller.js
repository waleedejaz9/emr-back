const { User, Role } = require("../models/user.model");
const { Module, Question, Answer, ModuleType, Esign } = require("../models/module.model");
const mongoose = require("mongoose");
const getUserIdFromToken = require("../utils/getUserIdFromToken.util");
const path = require("path");
const uploadToAzure = require("../utils/uploadToAzure");

const ModuleController = {
  async getModules(req, res) {
    try {
      const { user } = req;
      // const superAdminId = new mongoose.Types.ObjectId("666761113814857c7bd01542");
      const modules = await Module.find({ company: user.company })
        .populate("questions")
        .populate("type")
        .populate("createdBy");

      return res.status(200).json({ success: true, length: modules.length, data: modules });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
  async getModulesById(req, res) {
    try {
      const { user } = req;
      const moduleId = req.params.moduleId;

      const [module] = await Module.find({ _id: moduleId })
        .populate("questions")
        .populate("type")
        .populate("createdBy");

      if (!module) {
        return res.status(400).json({ success: false, message: "Module not found." });
      }

      const questionsWithAnswers = await Promise.all(
        (module.questions || []).map(async (question) => {
          const answers = await Answer.find({ questionId: question._id });
          return {
            ...question.toObject(),
            answers: answers,
          };
        })
      );

      const transformedModule = {
        ...module.toObject(),
        questions: questionsWithAnswers,
      };

      return res.status(200).json({ success: true, data: transformedModule });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async getAllModuleType(req, res) {
    try {
      const modules = await ModuleType.find();
      return res.status(200).json({ success: true, length: modules.length, data: modules });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
  async createModuleType(req, res) {
    try {
      const { name } = req.body;

      const newModule = await ModuleType.create({ name });

      return res.status(201).json({
        success: true,
        message: "Module type created successfully.",
        data: newModule,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async getModuleByType(req, res) {
    try {
      const { user } = req;
      const type = req.params.type;

      const superAdminId = new mongoose.Types.ObjectId("666761113814857c7bd01542");

      let module;

      if (user.roles.equals(superAdminId)) {
        module = await Module.find({ type }).populate("questions").populate("createdBy");
      } else {
        module = await Module.find({ type, company: user.company })
          .populate("questions")
          .populate("createdBy");
      }

      return res.status(200).json({ success: true, length: module.length, data: module });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
  async getModulesAssignedToUser(req, res) {
    try {
      const { user } = req;
      const type = req.params.type;

      const modules = await Module.find({ assignTo: { $in: [user._id] }, type: type })
        .populate("questions")
        .populate("type")
        .populate("createdBy");

      return res.status(200).json({
        success: true,
        message: "Modules found.",
        length: modules.length,
        data: modules,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async CreateModule(req, res) {
    try {
      const { name, description, type } = req.body;

      const { user } = req;

      if (!user) {
        return res.status(400).json({ success: false, message: "User not found." });
      }
      if (!user.roles) {
        return res.status(400).json({ success: false, message: "User role not defined." });
      }

      const moduleType = await ModuleType.findById(type);

      if (!moduleType) {
        return res.status(400).json({ success: false, message: "Module type not found." });
      }

      // const minId = new mongoose.Types.ObjectId("666761113814857c7bd01542");

      const moduleData = {
        type: moduleType._id,
        userId: user._id,
        name,
        description,
        createdBy: user._id,
      };

      // if (!user.roles.equals(superAdminId)) {
      //   moduleData.company = user.company;
      // }

      const module = await Module.create(moduleData);

      return res.status(200).json({
        success: true,
        message: "Module created successfully.",
        data: module,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async createQuestions(req, res) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const moduleId = req.params.moduleId;
        const { user } = req;
        const { assignTo, questions } = req.body;

        // Validate user
        if (!user) {
          throw new Error("User not found.");
        }

        // Fetch module and validate
        const module = await Module.findById(moduleId).session(session);
        if (!module) {
          throw new Error("Module not found.");
        }
        console.log(assignTo.length < 1);
        if (assignTo.length < 1) {
          throw new Error("Module must be assigned to a user");
        }

        // Fetch users to assign and validate
        const usersAssign = await User.find({ _id: { $in: assignTo } }).session(session);
        if (usersAssign.length !== assignTo.length) {
          throw new Error("One or more assigned users not found.");
        }

        // Create questions
        const createdQuestions = questions.map((question) => ({
          moduleId,
          assignTo,
          statement: question.statement,
          type: question?.type,
          required: question?.required,
          options: question?.options,
        }));

        const createdQuestionDocuments = await Question.create(createdQuestions, { session });
        const createdQuestionIds = createdQuestionDocuments.map((question) => question._id);

        // Update module with new questions
        module.questions = module.questions.concat(createdQuestionIds);
        module.assignTo = assignTo;
        module.company = usersAssign[0].company;
        await module.save({ session });

        const allQuestions = await Question.find({ moduleId }).session(session);

        res.status(200).json({
          success: true,
          message: "Questions created successfully.",
          length: allQuestions.length,
          data: allQuestions,
        });
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    } finally {
      session.endSession();
    }
  },
  async createAnswer(req, res) {
    try {
      const moduleId = req.params.moduleId;
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

      const module = await Module.findById(moduleId);

      if (!module) {
        return res.status(400).json({ success: false, message: "Module not found." });
      }

      const questionIds = answers.map((answer) => answer.questionId);

      const existingAnswers = await Answer.find({
        moduleId,
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
            moduleId,
            userId: user._id,
            questionId: answer.questionId,
            answer: answer.answer,
            type: answer.type,
          };
          if (answer.type === "E-Sign Field" && req.files) {
            const file = req.files.find((file) => file.fieldname === `answers[${index}].answer`);
            if (file) {
              const fileUrl = await uploadToAzure(file);
              console.log({ fileUrl });
              answerData.answer = fileUrl;
            }
          }

          return answerData;
        })
      );

      const answerAdded = await Answer.insertMany(createdAnswers);

      return res.status(200).json({
        success: true,
        message: "Answer created successfully.",
        data: answerAdded,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async createModuleAnswer(req, res) {
    try {
      const moduleId = req.params.moduleId;
      const { user } = req;
      const { answer } = req.body;

      const module = await Module.findById(moduleId);
      if (!module) {
        return res.status(400).json({ success: false, message: "Module not found." });
      }

      const existingEsign = await Esign.findOne({
        moduleId,
        userId: user._id,
        questionId: answer.questionId,
      });
      console.log(req.file);
      const filePath = path.resolve(__dirname, "uploads", req?.file?.filename || "ok");
      let createdAnswer;
      if (existingEsign) {
        // Update existing E-Sign field
        existingEsign.answer = filePath; // Assuming filePath is defined elsewhere
        await existingEsign.save();

        createdAnswer = existingEsign;
      } else {
        // Create new E-Sign field
        const filePath = path.resolve(__dirname, "uploads", req.file.filename || "UPLOAD");

        createdAnswer = await Esign.create({
          moduleId,
          userId: user._id,
          questionId: answer.questionId,
          answer: filePath,
          type: "E-Sign Field",
        });
      }

      // Insert in the module answer
      const newAnswer = new Answer({
        moduleId,
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
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = ModuleController;
