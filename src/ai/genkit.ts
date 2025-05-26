
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn(`
    ****************************************************************************************
    WARNING: GOOGLE_API_KEY or GEMINI_API_KEY environment variable is not set.
    Genkit flows using Google AI will likely fail.
    Please ensure you have a .env file with the key or set it in your environment.

    For local development, create a .env file in the project root with:
    GOOGLE_API_KEY=your_actual_api_key

    For deployed environments, set this as a server-side environment variable.
    ****************************************************************************************
  `);
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
