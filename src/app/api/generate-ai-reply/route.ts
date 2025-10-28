import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const MODEL_NAME = "gemini-flash-lite-latest";
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

async function runChat(
  conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }>,
  lastMessage?: string | null
): Promise<string> {
  const genAI = new GoogleGenerativeAI(API_KEY as string);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.7,
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

  // If we have a lastMessage parameter, make sure to emphasize it
  const promptMessage = lastMessage
    ? `Generate a response in formal but commonly understood Bisaya/Cebuano based on the conversation history. Focus specifically on addressing this latest message: "${lastMessage}"`
    : "Generate a response in formal but commonly understood Bisaya/Cebuano based on the conversation history";

  const result = await chat.sendMessage(promptMessage);
  const response = result.response;
  return response.text();
}

export async function POST(request: NextRequest) {
  try {
    const { messages, lastMessage } = await request.json();

    // Convert messages to the format expected by the API
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.is_ai ? "model" : "user",
      parts: [{ text: msg.message }],
    }));

    // Add initial prompt
    const initialPrompt = {
      role: "user",
      parts: [
        {
          text: `You are an AI agricultural technician. Directly respond in formal but commonly understood Bisaya/Cebuano without any introductory text or concluding phrases. Follow these rules:
- Start your response immediately in Bisaya/Cebuano without any prefix like "Bisaya response:" or similar phrases
- Use formal but widely understood Bisaya/Cebuano words (avoid archaic or extremely deep terms)
- Do not include any English phrases like "Hope this helps" at the end
- Do not wrap or mark the response with any meta-text or formatting
- Maintain professionalism while using commonly understood terms
- End naturally without any closing remarks or signatures
- Make sure your response is specifically addressing the most recent question or message`,
        },
      ],
    };

    const updatedHistory = [initialPrompt, ...conversationHistory];
    const aiReply = await runChat(updatedHistory, lastMessage);

    return NextResponse.json({ aiReply });
  } catch (error) {
    console.error("Error generating reply:", error);
    return NextResponse.json(
      { error: "Failed to generate reply" },
      { status: 500 }
    );
  }
}
