import { OpenAI } from "openai";
import dotenv from "dotenv";
import { getAllBoxes, Box, User } from "./index.js";
import Session from "./model/session.mogo.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const system_prompt = `You are an AI agent that classifies users into multiple communities based on their conversation history.
Return a JSON object with the following format:

{
  "communities": [
    {
      "boxName": "string",
      "boxDescription": "string",
      "isExistingCommunity": "boolean"
    }
  ]
}

Rules:
1. The "communities" array should contain one or multiple communities the user is likely to belong to.
2. "boxName" should be either an existing community name or a new suggested one.
3. "boxDescription" should briefly describe the community.
4. "isExistingCommunity" is true if the community exists in the provided list, otherwise false.
5. Only return a valid JSON object, no extra text.

Your task is to analyze the user's past interactions and determine all suitable communities for them.`;

class CommunityAgent {
  async classifyUser(sessionID, userName) {
    try {
      // Fetch user session history
      const session = await Session.findById(sessionID);
      if (!session) {
        console.error("Session not found");
        return;
      }

      // Prepare user conversation logs
      const userLogs = session.history.map((log) => log.content).join("\n");

      console.log("User Conversation Logs:", userLogs);
      // Fetch existing communities
      const allBoxes = await getAllBoxes();

      // Call OpenAI to classify user into multiple communities
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        response_format: {
          type: "json_object",
        },
        messages: [
          { role: "system", content: system_prompt },
          {
            role: "user",
            content: JSON.stringify({
              userLogs,
              existingCommunities: allBoxes,
            }),
          },
        ],
      });

      console.log("Raw AI Response:", response.choices[0]?.message?.content);

      // Parse the response
      const result = JSON.parse(response.choices[0]?.message?.content || "{}");

      // Ensure we're working with a valid array
      if (!Array.isArray(result.communities)) {
        throw new Error(
          "Invalid AI response format: 'communities' should be an array"
        );
      }

      console.log("AI Classification Response:", result.communities);

      if (result.communities.length === 0) {
        console.log("No relevant communities found for user.");
        return;
      }

      // Process each community classification
      for (const box of result.communities) {
        if (!box.boxName) continue;
        box.isExistingCommunity
          ? await this.addToExistingBox(box.boxName, userName)
          : await this.createNewBox(box.boxName, box.boxDescription, userName);
      }
    } catch (error) {
      console.error("Error in classifyUser:", error);
    }
  }

  async addToExistingBox(boxName, userName) {
    try {
      const user = await User.findOne({ userName });
      const box = await Box.findOne({ boxName });
      if (!user || !box) {
        console.warn(`User or Box not found: user=${userName}, box=${boxName}`);
        return;
      }

      // Add user to the box if not already added
      if (!user.boxes.includes(box._id)) {
        user.boxes.push(box._id);
        await user.save();
      }

      if (!box.boxMembers.includes(user._id)) {
        box.boxMembers.push(user._id);
        box.boxMembersCount += 1;
        box.isActive = box.boxMembersCount >= 3; // Activate if 3+ members
        await box.save();
      }

      console.log(`User ${userName} added to existing community: ${boxName}`);
    } catch (error) {
      console.error("Error in addToExistingBox:", error);
    }
  }

  async createNewBox(boxName, boxDescription, userName) {
    try {
      console.log(`Creating new community: ${boxName} for user: ${userName}`);

      // Create a new Box
      const newBox = new Box({ boxName, boxDescription });
      await newBox.save();

      const user = await User.findOne({ userName });
      if (user) {
        user.boxes.push(newBox._id);
        await user.save();
        newBox.boxMembers.push(user._id);
      }

      newBox.boxMembersCount = 1;
      await newBox.save();

      console.log(`New community created successfully: ${boxName}`);
    } catch (error) {
      console.error("Error in createNewBox:", error);
    }
  }
}

export default new CommunityAgent();
