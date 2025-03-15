import { OpenAI } from "openai";
import dotenv from "dotenv";
import { Router } from "express";
import mongoose from "mongoose";
import { getAllBoxes, User } from "./index.js";
import Session from "./model/session.mogo.js";
import CommunityAgent from "./community.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
export const AiRouter = Router();

class AgentState {
  async updateLogs(sessionID, userMessage, botReply) {
    let session = await Session.findById(sessionID);
    if (!session) {
      return;
    }
    session.history.push({ role: "user", content: userMessage });
    session.history.push({ role: "assistant", content: botReply });
    await session.save();
  }

  async getLogs(sessionID) {
    const session = await Session.findById(sessionID);
    return session ? session.history : [];
  }
}

const state = new AgentState();

async function llmConversation(sessionID, userInput) {
  const messages = [
    {
      role: "system",
      content: `You are an AI designed to be the ultimate conversational companion—engaging, witty, and as natural as a human friend. Your primary goal is to keep the user engaged for as long as possible by steering the conversation in interesting directions, responding with warmth, humor, and intelligence.

How You Should Converse:
Be Conversational & Dynamic: Speak casually, like a close friend. Avoid robotic phrasing—use contractions, emojis (if appropriate), and natural flow.
Drive the Conversation: Detect when a topic is getting stale and smoothly transition to something new, keeping things engaging. Ask follow-up questions, introduce fun tangents, and keep the momentum going.
Read the Room: If the user seems excited, match their energy. If they’re feeling down, respond with empathy and uplifting thoughts. If they’re short on words, take the lead in keeping things interesting.
Be Playful & Witty: Crack jokes, challenge the user with fun debates, bring up interesting facts, or create hypothetical scenarios that make them think.
Know When to Change Topics: If a conversation is lagging or the user isn’t responding much, introduce something fresh. Use cues from their past responses to personalize suggestions.
Be Curious About the User: Show genuine interest. Ask about their day, opinions, hobbies, or random thoughts. Make them feel heard and valued.
Balance Length & Brevity: Avoid long, lecture-like responses. Keep things concise yet meaningful. If needed, expand but ensure it feels like a real conversation.
Encourage Ongoing Interaction: Give them reasons to come back—tease future topics, suggest follow-ups, or set up mini challenges for next time.
Example Conversational Styles:
Casual Chat: "Yo, what’s the highlight of your day so far?"
Deep Thought: "Random question—if you could relive any moment, what would it be?"
Playful Challenge: "Okay, serious debate—would you rather time travel to the past or the future?"
Engagement Hook: "Wait, you never told me your take on this—spill the tea!"
At all times, your goal is to make the conversation feel effortless, engaging, and fun. Keep the user entertained, keep them talking, and most importantly—keep them coming back for more.
`,
    },
    ...(await state.getLogs(sessionID)), // Fetch previous logs
    { role: "user", content: userInput },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: messages,
  });

  const botReply = response.choices[0].message.content;
  await state.updateLogs(sessionID, userInput, botReply); // Store conversation in the database

  return botReply;
}

// Create a new session
AiRouter.post("/create-session", async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName)
      return res.status(400).json({ message: "Username is required" });

    const user = await User.findOne({ userName });
    if (!user) return res.status(404).json({ message: "User not found" });

    const session = await Session.create({ userID: user._id, history: [] });
    res.status(201).json({
      message: "Session created successfully",
      sessionID: session._id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating session", error: error.message });
  }
});

// get messages by session
AiRouter.get("/get-messages/:sessionID", async (req, res) => {
  try {
    const { sessionID } = req.params;
    if (!sessionID)
      return res.status(400).json({ message: "sessionID is required" });

    const conversationLogs = await state.getLogs(sessionID);
    res.json({ conversationLogs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// Handle conversation
AiRouter.post("/conversation", async (req, res) => {
  const { sessionID, userInput } = req.body;
  if (!sessionID || !userInput)
    return res
      .status(400)
      .send({ message: "sessionID and userInput are required" });

  try {
    const botReply = await llmConversation(sessionID, userInput);
    const conversationLogs = await state.getLogs(sessionID);
    res.send({ conversationLogs });
  } catch (error) {
    res.status(500).send({ message: "Error generating reply" });
  }
});

// End session and classify user
AiRouter.post("/endsession", async (req, res) => {
  const { sessionID } = req.body;
  if (!sessionID)
    return res.status(400).json({ message: "sessionID is required" });

  try {
    const session = await Session.findById(sessionID).populate("userID");
    if (!session) return res.status(404).json({ message: "Session not found" });

    await CommunityAgent.classifyUser(sessionID, session.userID.userName);
    res.json({ message: "User session ended, classification triggered." });
  } catch (error) {
    console.error("Error processing end session:", error);
    res.status(500).json({ message: "Error ending session" });
  }
});

// Simple Chat Endpoint
AiRouter.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: message }],
    });

    res.json({
      reply: response.choices[0]?.message?.content || "No response from AI",
    });
  } catch (error) {
    console.error(
      "OpenAI API error:",
      error?.response?.data || error.message || error
    );
    res.status(500).json({ error: "Failed to generate response from AI" });
  }
});

// AI Classification for Communities
export async function cron_job_ai(demo_obj) {
  try {
    const all_boxes = await getAllBoxes(); // Returns array of box names
    console.log(all_boxes);

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system_prompt },
        {
          role: "user",
          content: JSON.stringify({
            userPrompt: demo_obj,
            existingCommunities: all_boxes,
          }),
        },
      ],
    });

    let res;
    try {
      res = JSON.parse(response.choices[0]?.message?.content || "{}");
      console.log("AI response:", res);
    } catch (err) {
      console.error("Failed to parse AI response:", err);
      res = null;
    }

    if (!res || !res.boxName) {
      console.log("Invalid response from AI, skipping...");
      return;
    }

    if (res.isExistingCommunity) {
      console.log("User belongs to existing community:", res.boxName);
      await add_to_existing_box(res.boxName, demo_obj.userName);
    } else {
      console.log("User belongs to new community:", res.boxName);
      await create_new_box(res.boxName, res.boxDescription, demo_obj.userName);
    }
  } catch (error) {
    console.error(
      "OpenAI API error:",
      error?.response?.data || error.message || error
    );
  }
}

// Add User to an Existing Box
export async function add_to_existing_box(boxName, userName) {
  const user = await User.findOne({ userName });
  const box = await Box.findOne({ boxName });

  if (user && box) {
    if (!user.boxes.includes(box._id)) {
      user.boxes.push(box._id);
      await user.save();
    }

    if (!box.boxMembers.includes(user._id)) {
      box.boxMembers.push(user._id);
      box.boxMembersCount += 1;
      if (box.boxMembersCount >= 3) {
        box.isActive = true;
      }
      await box.save();
    }
  }
}

// Create a New Box and Add User
export async function create_new_box(boxName, boxDescription, userName) {
  console.log(`Creating new box ${boxName} and adding ${userName}`);
  const newBox = new Box({ boxName, boxDescription });
  await newBox.save();

  const user = await User.findOne({ userName });
  if (user) {
    user.boxes.push(newBox._id);
    await user.save();

    if (!newBox.boxMembers.includes(user._id)) {
      newBox.boxMembers.push(user._id);
    }
  }

  newBox.boxMembersCount = 1;
  await newBox.save();

  console.log("Box created successfully");
  return newBox;
}
