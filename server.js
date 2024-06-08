const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const path = require("path");
const bodyParser = require("body-parser");
const AuthController = require("./controller/auth.controller");
const connectDB = require("./db/connect.db");
const userRoutes = require("./routes/user.route");
const roleRoutes = require("./routes/role.route");
const portalRoutes = require("./routes/portal.route");
const permissionRoute = require("./routes/permission.route");
const moduleRoute = require("./routes/module.route");
const moduleTypeRoute = require("./routes/moduleType.route");
const SurveyRoute = require("./routes/survey.route");
const trainingRoutes = require("./routes/training.route");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const { Image, User } = require("./models/user.model");
const TrainingController = require("./controller/training.controller");
const authorize = require("./middlewares/authorize.middleware");
const { whiteList } = require("./config");
dotenv.config();

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

const originWhitelist = whiteList;
const corsOptions = {
  optionsSuccessStatus: 200,
  origin: (origin, callback) => {
    if (originWhitelist.indexOf(origin) !== -1 || !origin) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));
app.options("*", cors());
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  },
});

const upload = multer({ storage: storage });

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/user", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/permission", permissionRoute);
app.use("/api/module", moduleRoute);
app.use("/api/moduleType", moduleTypeRoute);
app.use("/api/survey", SurveyRoute);
app.use("/api/training", trainingRoutes);
app.get("/api/trainingType", [authorize()], TrainingController.getTrainingType);

app.post("/api/uploadImage/:userId", upload.single("image"), async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const filePath = path.join("uploads", req.file.filename);

    const imageCreated = await Image.findOne({ userId });
    if (imageCreated) {
      return res.status(400).json({ error: "Image already created. Update the image" });
    }

    const newImage = new Image({
      userId: user._id,
      imagePath: filePath,
    });
    await newImage.save();

    user.imagePath = filePath;
    await user.save();

    const imageUrl = `${req.protocol}://${req.get("host")}/${filePath}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error(`Error uploading image: ${error.message}`);
    res.status(500).json({ error: "An error occurred while uploading the image." });
  }
});
app.patch("/api/updateImage/:userId", upload.single("image"), async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid image ID." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const image = await Image.findOne({ userId });
    if (!image) {
      return res.status(404).json({ error: "Image not found for this user not found." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const newFilePath = path.join("uploads", req.file.filename);
    image.imagePath = newFilePath;

    await image.save();

    user.imagePath = newFilePath;
    await user.save();

    const imageUrl = `${req.protocol}://${req.get("host")}/${newFilePath}`;
    return res.json({ imageUrl });
    // res.sendFile(newFilePath, (err) => {
    //   if (err) {
    //     console.error(`Error sending file: ${err.message}`);
    //     return res.status(500).json({ error: "File could not be sent." });
    //   }
    // });
  } catch (error) {
    console.error(`Error updating image: ${error.message}`);
    res.status(500).json({ error: "An error occurred while updating the image." });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    console.error(`Unexpected error: ${err.message}`);
    return res.status(500).json({ error: "An unknown error occurred." });
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5713;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await connectDB();
});
