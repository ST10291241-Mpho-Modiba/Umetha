import { GoogleGenAI, PersonGeneration } from '@google/genai'; 
import { NextApiRequest } from 'next';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// POST method handler
export async function POST(req: NextApiRequest) {
  try {
    const { imageBase64, prompt } = await req.json(); // Parse request body as JSON

    if (!imageBase64 || !prompt) {
      return NextResponse.json(
        { message: 'Image and prompt are required.' },
        { status: 400 }
      );
    }

    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt, // Use prompt from request body
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        durationSeconds: 8,
        personGeneration: PersonGeneration.ALLOW_ALL,
      },
    });

    // Poll the operation status until the video is ready
    while (!operation.done) {
      console.log('Waiting for video generation to complete...');
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Poll every 10 seconds
      operation = await ai.operations.getVideosOperation({ operation });
    }

    // Check if videos are generated
    if (operation.response && operation.response.generatedVideos) {
      const videoUri = operation.response.generatedVideos[0]?.video?.uri;
      console.log(`Video generated: ${videoUri}`);

      // Respond with the video URL to be used in the front-end
      return NextResponse.json({ videoUrl: videoUri });
    } else {
      return NextResponse.json(
        { message: 'No videos generated or error occurred.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in video generation:', error);

    // Respond with an error message
    return NextResponse.json(
      { message: 'Error in video generation', error: error.message },
      { status: 500 }
    );
  }
}

// Method not allowed handler (for non-POST requests)
export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
