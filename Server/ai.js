import { OpenAI } from "openai";
import dotenv from "dotenv";
import { Router } from "express";
import { Box, getAllBoxes, User } from "./index.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const system_propmt = `You are an AI that classifies users into communities based on their logs. 
Return only a JSON object with the following structure:

{
  "boxName": "string",
  "boxDescription": "string",
  "isExistingCommunity": "boolean"
}

Rules:
1. "boxName" should be either an existing community name or a new suggested one.
2. "boxDescription" should be a brief description of the community.
3. "isExistingCommunity" should be true if the community exists in the provided list, otherwise false.
4. Do not include any extra text, only return valid JSON.

Details: 
Given a user log detailing an individual's interactions, preferences, and thoughts, along with a list of existing communities, analyze the user's characteristics and determine the most suitable community for them. If the user aligns with an existing community, assign them to it. If no suitable community exists.`;

export const AiRouter = Router();

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

export async function cron_job_ai(demo_obj) {
  try {
    const all_boxes = await getAllBoxes(); // Returns array of box names
    console.log(all_boxes);

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system_propmt },
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
      console.log("User belongs to existing community: ", res.boxName);
      await add_to_existing_box(res.boxName, demo_obj.userName);
    } else {
      console.log("User belongs to new community: ", res.boxName);
      await create_new_box(res.boxName, res.boxDescription, demo_obj.userName); // Only one call needed
    }
  } catch (error) {
    console.error(
      "OpenAI API error:",
      error?.response?.data || error.message || error
    );
  }
}

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

export async function create_new_box(boxName, boxDescription, userName) {
  console.log(`Creating new box ${boxName} and adding ${userName}`);
  const newBox = new Box({ boxName: boxName, boxDescription: boxDescription });
  await newBox.save();

  const usr = await User.findOne({ userName });
  if (usr) {
    usr.boxes.push(newBox._id);
    await usr.save();

    if (!newBox.boxMembers.includes(usr._id)) {
      newBox.boxMembers.push(usr._id);
    }
  }

  newBox.boxMembersCount = 1;
  await newBox.save();

  console.log("Box created successfully");
  return newBox;
}
