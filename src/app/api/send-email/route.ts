import { NextRequest, NextResponse } from "next/server";
import Mailjet from "node-mailjet";

export async function POST(req: NextRequest) {
  const { email, recipient_name, subject, message } = await req.json();

  if (!email || !subject || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC as string,
    process.env.MJ_APIKEY_PRIVATE as string
  );

  try {
    const request = mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MJ_EMAIL_REGISTERED, // email address used in Mailjet account
            Name: "Kaitawan Tamu",
          },
          To: [
            {
              Email: email,
              Name: recipient_name,
            },
          ],
          Subject: subject,
          TextPart: message,
        },
      ],
    });

    const result = await request;
    return NextResponse.json({
      message: "Email sent successfully!",
      result: result.body,
    });
  } catch (error: any) {
    console.log("Error details:", error); // Log the error for debugging

    const errorMessage =
      error.response?.body || error.message || "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to send email",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Hello from the API route" });
}
