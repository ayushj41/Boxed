import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import dotenv from "dotenv";

dotenv.config();

const taggingPrompt = PromptTemplate.fromTemplate(`
You are a tagging agent that analyzes conversations and generates relevant tags.
Given the following conversation or post content, generate up to 5 relevant tags.
The tags should capture key themes, emotions, topics, and context.

Content: {content}

Return only a JSON array of tags. Example format:
["tag1", "tag2", "tag3"]

Rules:
1. Each tag should be a single word or short phrase (max 3 words)
2. Tags should be lowercase
3. No special characters except hyphens
4. Maximum 5 tags
5. Tags should be relevant and meaningful
`);

export async function generateTags(content) {
    try {
        const model = new OpenAI({
            temperature: 0.7,
            modelName: "gpt-4",
            openAIApiKey: process.env.OPENAI_KEY,
        });

        const chain = new LLMChain({
            llm: model,
            prompt: taggingPrompt
        });

        const response = await chain.call({
            content: content
        });

        // Parse the response to get tags array
        let tags;
        try {
            tags = JSON.parse(response.text);
            // Ensure we have an array of strings
            if (!Array.isArray(tags)) {
                tags = [];
            }
            // Limit to 5 tags and clean them
            tags = tags
                .slice(0, 5)
                .map(tag => tag.toLowerCase().trim())
                .filter(tag => tag.length > 0);
        } catch (e) {
            console.error("Error parsing tags:", e);
            tags = [];
        }

        return tags;
    } catch (error) {
        console.error("Error generating tags:", error);
        return [];
    }
} 