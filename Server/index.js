import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { AiRouter, cron_job_ai } from "./ai.js";
dotenv.config();
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define User Schema
const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true, required: true },
  logs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Log", default: [] }],
  boxes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Box",
      default: [],
    },
  ],
});

export const User = mongoose.model("User", userSchema);

// Define Log Schema
const logSchema = new mongoose.Schema({
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Log = mongoose.model("Log", logSchema);

//Define box schema

const boxSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  boxName: { type: String, required: true },
  boxImage: {
    type: String,
    required: true,
    default:
      "https://plus.unsplash.com/premium_vector-1727309324616-78d628deaab3?q=80&w=2766",
  },
  boxVisits: { type: Number, default: 0 },
  boxMembers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
  ],
  boxMembersCount: { type: Number, default: 0 },
  boxPosts: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: [] },
  ],
  boxPostsCount: { type: Number, default: 0 },
});

export const Box = mongoose.model("Box", boxSchema);

//Define post schema

const postSchema = new mongoose.Schema({
  postContent: { type: String, required: true },
  postAuthor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  postBox: { type: mongoose.Schema.Types.ObjectId, ref: "Box", required: true },
  timestamp: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

// Authentication API
app.post("/auth", async (req, res) => {
  try {
    const { userName, action } = req.body;
    if (!userName)
      return res.status(400).json({ message: "Username is required" });

    let user = await User.findOne({ userName });

    if (action === "register") {
      if (user)
        return res.status(400).json({ message: "Username already taken" });
      user = new User({ userName });
      await user.save();
      return res
        .status(201)
        .json({ message: "User registered successfully", user });
    }

    if (action === "login") {
      if (!user) return res.status(400).json({ message: "User not found" });
      return res.status(200).json({ message: "Login successful", user });
    }

    res.status(400).json({ message: "Invalid action" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error during authentication", error: error.message });
  }
});

// Endpoint to store a message in the logs array
app.post("/addlogs", async (req, res) => {
  try {
    const { userName, message } = req.body;

    if (!userName) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const newLog = new Log({ message });
    await newLog.save();

    const user = await User.findOne({ userName });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.logs.push(newLog);
    await user.save();

    res.status(201).json({ message: "Log stored successfully", log: newLog });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error storing log", error: error.message });
  }
});

// Endpoint to get all logs of a user
app.get("/getlogs/:userName", async (req, res) => {
  try {
    const { userName } = req.params;

    if (!userName) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findOne({ userName }).populate("logs");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    res.status(200).json({ logs: user.logs });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching logs", error: error.message });
  }
});

// Endpoint to create a single Box
app.post("/box", async (req, res) => {
  try {
    const { boxName, boxImage } = req.body;
    if (!boxName || !boxImage) {
      return res
        .status(400)
        .json({ message: "Box name and image are required" });
    }

    const newBox = new Box({ boxName, boxImage });
    await newBox.save();
    res.status(201).json({ message: "Box created successfully", box: newBox });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating box", error: error.message });
  }
});

// Endpoint to create a single Post
app.post("/post", async (req, res) => {
  console.log(req.body);
  try {
    const { postContent, postAuthor, postBox } = req.body;
    if (!postContent || !postAuthor || !postBox) {
      return res
        .status(400)
        .json({ message: "Post content, author, and box are required" });
    }

    const user = await User.findOne({ userName: postAuthor });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    console.log(_id);

    const newPost = new Post({ postContent, postAuthor: user._id, postBox });
    await newPost.save();

    await Box.findByIdAndUpdate(postBox, {
      $push: { boxPosts: newPost._id },
      $inc: { boxPostsCount: 1 },
    });

    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating post", error: error.message });
  }
});

// Endpoint for bulk uploads of Boxes
app.post("/bulk/boxes", async (req, res) => {
  try {
    const { boxes } = req.body;
    if (!Array.isArray(boxes) || boxes.length === 0) {
      return res.status(400).json({ message: "Invalid or empty boxes array" });
    }

    const createdBoxes = await Box.insertMany(boxes);
    res
      .status(201)
      .json({ message: "Boxes created successfully", boxes: createdBoxes });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in bulk box creation", error: error.message });
  }
});

// Endpoint for bulk uploads of Posts
app.post("/bulk/posts", async (req, res) => {
  try {
    const { posts } = req.body;
    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ message: "Invalid or empty posts array" });
    }

    const createdPosts = await Post.insertMany(posts);
    const postUpdates = createdPosts.map((post) =>
      Box.findByIdAndUpdate(post.postBox, {
        $push: { boxPosts: post._id },
        $inc: { boxPostsCount: 1 },
      })
    );
    await Promise.all(postUpdates);

    res
      .status(201)
      .json({ message: "Posts created successfully", posts: createdPosts });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in bulk post creation", error: error.message });
  }
});

// Endpoint for bulk uploads of Users
app.post("/bulk/users", async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "Invalid or empty users array" });
    }

    const createdUsers = await User.insertMany(users);
    const userIds = createdUsers.map((user) => user._id);
    res.status(201).json({ message: "Users created successfully", userIds });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error in bulk user creation", error: error.message });
  }
});

// Endpoint to get boxes of a user
app.get("/userboxes/:userName", async (req, res) => {
  try {
    const { userName } = req.params;
    const user = await User.findOne({ userName }).populate("boxes");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ boxes: user.boxes });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user boxes", error: error.message });
  }
});

// Endpoint to get all boxes
app.get("/boxes", async (req, res) => {
  try {
    const boxes = await Box.find({});
    res.status(200).json({ boxes });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching boxes", error: error.message });
  }
});

// Endpoint to get a single box by ID
app.get("/boxes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const box = await Box.findById(id).populate("boxMembers boxPosts");
    if (!box) {
      return res.status(404).json({ message: "Box not found" });
    }
    res.status(200).json({ box });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching box", error: error.message });
  }
});

export async function getAllBoxes() {
  //get all box names
  const boxes = await Box.find({});
  const names_of_boxes = boxes.map((box) => box.boxName);
  console.log(names_of_boxes);
  return names_of_boxes;
}

app.use("/ai", AiRouter);

// cron_job_ai();
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
