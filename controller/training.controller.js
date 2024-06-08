const { User, Role } = require("../models/user.model");
const { Training, TrainingType, VideoProgress } = require("../models/training.model");
const mongoose = require("mongoose");
const path = require("path");

const TrainingController = {
  async getTraining(req, res) {
    try {
      const { user } = req;
      const training = await Training.find().populate("videos");

      return res.status(200).json({ success: true, length: training.length, data: training });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
  async getTrainingById(req, res) {
    try {
      const { id } = req.params;
      const training = await Training.findById(id).populate("videos");
      if (!training) {
        return res.status(404).json({ success: false, message: "Training not found" });
      }
      return res.status(200).json({ success: true, data: training });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
  async createTraining(req, res) {
    try {
      const { user } = req;
      const { name, description, type, assignTo } = req.body;
      const filePath = path.resolve(__dirname, "uploads", req?.file?.filename || "ok");
      const newTraining = await Training.create({
        name,
        description,
        type,
        assignTo,
        picture: filePath,
        createdBy: user._id,
        company: user.company,
      });

      return res.status(200).json({ success: true, data: newTraining });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async createTrainingType(req, res) {
    try {
      const { user } = req;
      const { type, systemGenerated } = req.body;
      const trainingType = await TrainingType.create({
        type,
        systemGenerated,
        userId: user._id,
      });

      return res.status(200).json({ success: true, data: trainingType });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async getTrainingType(req, res) {
    try {
      const { user } = req;

      const query = {
        $or: [{ systemGenerated: true }, { systemGenerated: false, userId: user._id }],
      };

      const trainingTypes = await TrainingType.find(query);

      return res.status(200).json({ success: true, data: trainingTypes });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async getCompletionReport(req, res) {
    try {
      const { user } = req;
      const { trainingId } = req.params;
      const training = await Training.findById(trainingId).populate("videos");

      if (!training) {
        return res.status(404).json({ success: false, message: "Training not found" });
      }

      const totalUsers = training.assignTo.length;
      const videoIds = training.videos.map((video) => video._id);

      let completedUsers = 0;
      let inProgressUsers = 0;

      for (const user of training.assignTo) {
        const progressRecords = await VideoProgress.find({
          userId: user._id,
          videoId: { $in: videoIds },
        });

        const isCompleted =
          progressRecords.length === videoIds.length && progressRecords.every((record) => record.isCompleted);

        const isInProgress = progressRecords.some((record) => record.inProgress);

        if (isCompleted) {
          completedUsers++;
        } else if (isInProgress) {
          inProgressUsers++;
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          trainingId: training._id,
          totalUsers,
          completedUsers,
          inProgressUsers,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
  async getUserCompletionArr(req, res) {
    try {
      const { user } = req;
      const { trainingId } = req.params;
      const training = await Training.findById(trainingId);

      const users = training.assignTo;
      const videos = training.vides;
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
  async getUserCompletionArr(req, res) {
    try {
      const { trainingId } = req.params;
      const training = await Training.findById(trainingId).populate("videos").populate("assignTo");

      if (!training) {
        return res.status(404).json({ success: false, message: "Training not found" });
      }

      const users = training.assignTo;
      const videos = training.videos;

      let userProgressArr = [];

      for (let assignedUser of users) {
        const progressRecords = await VideoProgress.find({
          userId: assignedUser._id,
          videoId: { $in: videos.map((video) => video._id) },
        }).populate("userId");

        const completedVideosCount = progressRecords.filter((record) => record.isCompleted).length;
        const progressPercentage = (completedVideosCount / videos.length) * 100;

        let userProgress = {
          userId: assignedUser,
          progress: progressPercentage,
        };

        userProgressArr.push(userProgress);
      }

      return res.status(200).json({ success: true, data: userProgressArr });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = TrainingController;
