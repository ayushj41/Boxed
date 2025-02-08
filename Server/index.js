import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import { Router } from "express";
import { AiRouter, cron_job_ai } from "./ai.js";
dotenv.config();
const app = express();
const PORT = 3000;

const endpoint =
  process.env.ENV === "dev"
    ? process.env.DEV_FRONTEND_URL
    : process.env.PROD_FRONTEND_URL;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: endpoint,
    credentials: true,
  })
);

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
    },
  ],
});

// Ensure every new user has a default box ID
userSchema.pre("save", function (next) {
  if (!this.boxes || this.boxes.length === 0) {
    this.boxes = [new mongoose.Types.ObjectId("67a7bb9e85cc5705d29e306f")];
    // update the bockMembersCount
    Box.findByIdAndUpdate("67a7bb9e85cc5705d29e306f", {
      $inc: { boxMembersCount: 1 },
    }).exec();
  }
  next();
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
  boxDescription: { type: String, default: "" },
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

    console.log("Running AI job in the background");

    // Run the cron job in the background without blocking response
    setTimeout(async () => {
      try {
        await cron_job_ai({
          userName,
          message,
        });
      } catch (err) {
        console.error("Background AI job failed:", err);
      }
    }, 1);

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
    const { boxName, boxImage, boxDescription } = req.body;
    if (!boxName || !boxImage || !boxDescription) {
      return res
        .status(400)
        .json({ message: "Box name and image are required" });
    }

    const newBox = new Box({ boxName, boxImage, boxDescription });
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
    console.log(user._id);

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

// Endpoint for bulk uploads of Logs
app.post("/bulk/addlogs", async (req, res) => {
  try {
    const { logs } = req.body;
    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ message: "Invalid or empty logs array" });
    }

    // Create logs in bulk
    const createdLogs = await Log.insertMany(
      logs.map(({ message }) => ({ message }))
    );

    // Map logs to users and update them
    const userUpdates = logs.map(async ({ userName }, index) => {
      const user = await User.findOne({ userName });
      if (user) {
        user.logs.push(createdLogs[index]._id);
        await user.save();
      }
    });

    await Promise.all(userUpdates);

    res.status(201).json({
      message: "Logs added successfully and users updated",
      logs: createdLogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in bulk log addition",
      error: error.message,
    });
  }
});

// Endpoint for bulk uploads of Posts
app.post("/bulk/posts", async (req, res) => {
  try {
    const { posts } = req.body;
    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ message: "Invalid or empty posts array" });
    }

    // Batch insert posts
    const createdPosts = await Post.insertMany(posts, { ordered: false });

    // Group by `postBox` to batch update box records
    const boxUpdates = createdPosts.reduce((acc, post) => {
      if (!acc[post.postBox]) acc[post.postBox] = [];
      acc[post.postBox].push(post._id);
      return acc;
    }, {});

    // Perform batch updates for boxes
    const updatePromises = Object.entries(boxUpdates).map(([boxId, postIds]) =>
      Box.updateOne(
        { _id: boxId },
        {
          $push: { boxPosts: { $each: postIds } },
          $inc: { boxPostsCount: postIds.length },
        }
      )
    );
    await Promise.all(updatePromises);

    res.status(201).json({
      message: "Bulk posts created successfully",
      count: createdPosts.length,
    });
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

// Endpoint to get all posts by a user
app.get("/getposts/:userName", async (req, res) => {
  try {
    const { userName } = req.params;
    const user = await User.findOne({ userName });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const posts = await Post.find({ postAuthor: user._id }).populate("postBox");
    res.status(200).json({ posts });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
});

app.get("/random-box/:userName", async (req, res) => {
  try {
    const { userName } = req.params;
    const user = await User.findOne({ userName }).populate("boxes");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userBoxIds = user.boxes.map((box) => box._id);
    const randomBox = await Box.findOne({ _id: { $nin: userBoxIds } })
      .skip(
        Math.floor(
          Math.random() *
            (await Box.countDocuments({ _id: { $nin: userBoxIds } }))
        )
      )
      .populate("boxPosts");

    if (!randomBox) {
      return res.status(404).json({ message: "No available boxes found" });
    }

    res.status(200).json({ box: randomBox });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching random box", error: error.message });
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

export default app;
