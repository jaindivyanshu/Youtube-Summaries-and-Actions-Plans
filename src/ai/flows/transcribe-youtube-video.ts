
'use server';

/**
 * @fileOverview Transcribes a YouTube video, either by retrieving existing transcriptions or performing speech-to-text.
 *
 * - transcribeYouTubeVideo - A function that handles the YouTube video transcription process.
 * - TranscribeYouTubeVideoInput - The input type for the transcribeYouTubeVideo function.
 * - TranscribeYouTubeVideoOutput - The return type for the transcribeYouTubeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getTranscript, getVideoId, downloadAudioFromYouTube} from '@/services/youtube-service';

const TranscribeYouTubeVideoInputSchema = z.object({
  youtubeUrl: z.string().describe('The URL of the YouTube video to transcribe.'),
});
export type TranscribeYouTubeVideoInput = z.infer<typeof TranscribeYouTubeVideoInputSchema>;

const TranscribeYouTubeVideoOutputSchema = z.object({
  transcription: z.string().describe('The transcription of the YouTube video.'),
});
export type TranscribeYouTubeVideoOutput = z.infer<typeof TranscribeYouTubeVideoOutputSchema>;

export async function transcribeYouTubeVideo(
  input: TranscribeYouTubeVideoInput
): Promise<TranscribeYouTubeVideoOutput> {
  return transcribeYouTubeVideoFlow(input);
}

const transcribeYouTubeVideoFlow = ai.defineFlow(
  {
    name: 'transcribeYouTubeVideoFlow',
    inputSchema: TranscribeYouTubeVideoInputSchema,
    outputSchema: TranscribeYouTubeVideoOutputSchema,
  },
  async input => {
    const videoId = getVideoId(input.youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL provided.');
    }

    let transcription = await getTranscript(videoId);

    if (!transcription) {
      console.warn(`No pre-existing transcript found for video ${videoId}. Attempting AI transcription.`);
      // Attempt to download audio and use AI for transcription
      const audioDataUri = await downloadAudioFromYouTube(videoId);

      if (audioDataUri) {
        try {
          // Use a model that supports audio input, like gemini-1.5-flash.
          // The default model in genkit.ts (gemini-2.0-flash) might not be suitable for audio.
          const {text} = await ai.generate({
            model: 'googleai/gemini-1.5-flash', // Explicitly use a model supporting audio
            prompt: [
              {media: {url: audioDataUri}}, // Pass audio data as a data URI
              {text: 'Transcribe the audio from this video accurately. Provide only the transcribed text.'}
            ],
             config: { // It's good practice to include safety settings
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                    },
                    {
                        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                    },
                    {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                    },
                ],
            },
          });
          transcription = text;
          if (!transcription) {
            transcription = `AI speech-to-text for video ${videoId} resulted in an empty transcript.`;
          }
        } catch (error) {
          console.error(`AI transcription error for video ${videoId}:`, error);
          transcription = `AI speech-to-text transcription failed for video ${videoId}. Error: ${(error as Error).message}`;
        }
      } else {
        // This message will be shown because downloadAudioFromYouTube is a placeholder
        transcription = `Audio for video ${videoId} could not be downloaded for AI transcription. Manual audio download and AI processing would be required.`;
      }
    }

    return {transcription};
  }
);
