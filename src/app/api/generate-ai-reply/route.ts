import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-1.0-pro";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

async function runChat(userInput: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(API_KEY as string);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: [], // Empty history to ensure no context
  });

  const result = await chat.sendMessage(userInput);
  const response = result.response;
  return response.text();
}

export async function POST(request: NextRequest) {
  try {
    const { filteredMessage } = await request.json();

    // Add context for AI prompt in Bisaya/Cebuano dialect
    const prompt = `Based on the following message from a farmer, generate a simple and direct response using a simple Bisaya/Cebuano dialect as if you were a friendly expert local farmer focusing on practical advice and clear instructions: "${filteredMessage}"`;

    const aiReply = await runChat(prompt);

    return NextResponse.json({ aiReply });
  } catch (error) {
    console.error("Error generating reply:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
