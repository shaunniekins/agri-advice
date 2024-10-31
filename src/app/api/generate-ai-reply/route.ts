import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-1.0-pro";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

async function runChat(
  conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<string> {
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
    history: conversationHistory,
  });

  const result = await chat.sendMessage(
    "Generate a reply based on the conversation"
  );
  const response = result.response;
  return response.text();
}

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory } = await request.json();

    const prompt = {
      role: "user",
      parts: [
        {
          text: "Based on the following conversation between a farmer and a technician, generate a reply for a technician responding to a farmer's query in the Bisaya/Cebuano dialect. Do not provide or suggest any links. Make it short and concise.",
        },
      ],
    };

    const updatedConversationHistory = [prompt, ...conversationHistory]; // Prepend the prompt to the conversation history

    const aiReply = await runChat(updatedConversationHistory); // Pass updated conversation history

    return NextResponse.json({ aiReply });
  } catch (error) {
    console.error("Error generating reply:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
