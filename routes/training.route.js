const express = require("express");
const multer = require("multer");
const path = require("path");
const TrainingController = require("../controller/training.controller");
const authorize = require("../middlewares/authorize.middleware");
const { BlobServiceClient } = require("@azure/storage-blob");
const uploadMiddleware = require("../middlewares/upload.middleware");
const { Training, Video, VideoProgress } = require("../models/training.model");
const { azureKey, azureContainerName } = require("../config");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

const blobServiceClient = BlobServiceClient.fromConnectionString(
  azureKey
);
const containerClient = blobServiceClient.getContainerClient(azureContainerName);

router
  .get("/", [authorize()], TrainingController.getTraining)
  .get("/getById/:id", [authorize()], TrainingController.getTrainingById)
  .get("/completionReport/:trainingId", [authorize()], TrainingController.getCompletionReport)
  .get("/assignedReport/:trainingId", [authorize()], TrainingController.getUserCompletionArr)
  .post("/", [authorize()], uploadMiddleware("picture"), TrainingController.createTraining)
  .post("/createTrainingType", [authorize()], TrainingController.createTrainingType)
  .post(
    "/video/:trainingId",
    upload.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    [authorize()],
    async (req, res) => {
      try {
        const { user } = req;
        const { title, description } = req.body;
        const trainingId = req.params.trainingId;
        const training = await Training.findById(trainingId);
        if (!training) {
          return res.status(400).json({ error: "Invalid training ID." });
        }

        if (!req.files || !req.files.video || !req.files.thumbnail) {
          return res.status(400).json({ error: "Please upload both video and thumbnail files." });
        }

        const videoFile = req.files.video[0];
        const thumbnailFile = req.files.thumbnail[0];

        const videoBlobName = path.basename(videoFile.path);
        const thumbnailBlobName = `thumbnails/${path.basename(thumbnailFile.path)}`;

        const videoBlockBlobClient = containerClient.getBlockBlobClient(videoBlobName);
        const thumbnailBlockBlobClient = containerClient.getBlockBlobClient(thumbnailBlobName);

        await videoBlockBlobClient.uploadFile(videoFile.path);
        await thumbnailBlockBlobClient.uploadFile(thumbnailFile.path);

        const videoCreated = await Video.create({
          userId: user._id,
          trainingId,
          video: videoBlockBlobClient.url,
          thumbnail: thumbnailBlockBlobClient.url,
          title: title,
          description: description,
        });
        training.videos.push(videoCreated._id);
        await training.save();
        res.status(200).send({ message: "Video uploaded successfully", url: videoCreated });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
      }
    }
  )
  .get("/video/:videoId", [authorize()], async (req, res) => {
    try {
      const { videoId } = req.params;
      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({ error: "Video not found." });
      }
      return res.status(200).json({ success: true, data: video });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  })
  .patch(
    "/video/:videoId",
    upload.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    [authorize()],
    async (req, res) => {
      try {
        const { videoId } = req.params;
        const { title, description } = req.body;

        const videoToUpdate = await Video.findById(videoId);
        if (!videoToUpdate) {
          return res.status(404).json({ error: "Video not found." });
        }

        if (req.files && req.files.video) {
          const videoFile = req.files.video[0];
          const videoBlobName = path.basename(videoFile.path);
          const videoBlockBlobClient = containerClient.getBlockBlobClient(videoBlobName);

          await videoBlockBlobClient.uploadFile(videoFile.path);
          videoToUpdate.video = videoBlockBlobClient.url;
        }

        if (req.files && req.files.thumbnail) {
          const thumbnailFile = req.files.thumbnail[0];
          const thumbnailBlobName = `thumbnails/${path.basename(thumbnailFile.path)}`;
          const thumbnailBlockBlobClient = containerClient.getBlockBlobClient(thumbnailBlobName);

          await thumbnailBlockBlobClient.uploadFile(thumbnailFile.path);
          videoToUpdate.thumbnail = thumbnailBlockBlobClient.url;
        }

        if (title) {
          videoToUpdate.title = title;
        }

        if (description) {
          videoToUpdate.description = description;
        }

        await videoToUpdate.save();
        res.status(200).send({ message: "Video updated successfully", video: videoToUpdate });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: error.message });
      }
    }
  )
  .delete("/video/:videoId", [authorize()], async (req, res) => {
    try {
      const { videoId } = req.params;

      const videoToDelete = await Video.findById(videoId);
      if (!videoToDelete) {
        return res.status(404).json({ error: "Video not found." });
      }

      const training = await Training.findById(videoToDelete.trainingId);
      if (training) {
        // Remove the video ID from the training's videos array
        training.videos = training.videos.filter((id) => id.toString() !== videoId);
        await training.save();
      }

      await Video.deleteOne({ _id: videoId });
      res.status(200).send({ message: "Video deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: error.message });
    }
  })
  .post("/progress/:videoId", [authorize()], async (req, res) => {
    try {
      const { videoId } = req.params;
      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(400).json({ error: "Invalid training ID." });
      }
      const completionReport = await VideoProgress.findOneAndUpdate(
        { userId: req.user._id, videoId: videoId },
        {
          userId: req.user._id,
          videoId: videoId,
          // progress: true,
          trainingId: video.trainingId,
          isCompleted: false,
          inProgress: true,
        },
        { new: true, upsert: true }
      );
      return res.status(200).json({ success: true, data: completionReport });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  })
  .post("/completion/:videoId", [authorize()], async (req, res) => {
    try {
      const { videoId } = req.params;
      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(400).json({ error: "Invalid Video ID." });
      }
      const completionReport = await VideoProgress.findOneAndUpdate(
        { userId: req.user._id, videoId: videoId },
        {
          userId: req.user._id,
          videoId: videoId,
          // progress: true,
          trainingId: video.trainingId,
          isCompleted: true,
          inProgress: false,
        },
        { new: true, upsert: true }
      );
      return res.status(200).json({ success: true, data: completionReport });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });
module.exports = router;
