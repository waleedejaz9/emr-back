const mongoose = require("mongoose");
const { User } = require("../models/user.model");

const trainingSchema = new mongoose.Schema(
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
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    picture: {
      type: String,
      // required: true,
    },
    assignTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
      },
    ],
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

const traningTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
    },
    systemGenerated: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.systemGenerated;
      }, // userId is required only if systemGenerated is false
    },
  },
  { timestamps: true }
);

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },
    video: {
      type: String,
      required: true,
    },
    inProgress: {
      type: Boolean,
      default: false,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  trainingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Training",
    required: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  inProgress: {
    type: Boolean,
    default: false,
  },
});

const Training = mongoose.model("Training", trainingSchema);
const TrainingType = mongoose.model("TrainingType", traningTypeSchema);
const Video = mongoose.model("Video", videoSchema);
const VideoProgress = mongoose.model("VideoProgress", progressSchema);

module.exports = { Training, TrainingType, Video, VideoProgress };
