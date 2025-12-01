import { NextResponse } from "next/server";
import { GoogleAIClient } from "@google/generative-ai/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const prompt = form.get("prompt") as string;
    const image = form.get("image") as File | null;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt required" },
        { status: 400 }
      );
    }

    let inputImage = null;

    if (image) {
      const buffer = Buffer.from(await image.arrayBuffer());
      inputImage = {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: image.type,
        },
      };
    }

    const client = new GoogleAIClient({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const model = client.getGenerativeModel({
      model: "imagen-3.0",
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...(inputImage ? [inputImage] : []),
          ],
        },
      ],
    });

    const output =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData
        ?.data;

    if (!output) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ image: output });
  } catch (err: any) {
    console.error("IMAGE API ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
