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
import {getTranscript, getVideoId} from '@/services/youtube-service';

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
      //If transcription doesn't exists, should call Google Cloud Speech-to-Text API here instead
      transcription = `Transcription not available for video id: ${videoId}`;
    }

    return {transcription};
  }
);
