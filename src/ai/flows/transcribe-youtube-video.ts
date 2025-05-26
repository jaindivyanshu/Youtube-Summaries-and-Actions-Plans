
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

    if (transcription) {
      console.log(`Found pre-existing transcript for video ${videoId}.`);
    } else {
      console.warn(`No pre-existing transcript found for video ${videoId}. Attempting AI transcription from downloaded audio.`);
      
      const audioDataUri = await downloadAudioFromYouTube(videoId);

      if (audioDataUri) {
        console.log(`Audio downloaded for video ${videoId}. Proceeding with AI transcription.`);
        try {
          const {text} = await ai.generate({
            model: 'googleai/gemini-1.5-flash', 
            prompt: [
              {media: {url: audioDataUri}}, 
              {text: 'Transcribe the audio from this video accurately. Provide only the transcribed text.'}
            ],
             config: { 
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                ],
            },
          });

          transcription = text; // text can be null if generation fails or is blocked
          if (transcription === null || transcription === undefined || transcription.trim() === '') {
            console.warn(`AI speech-to-text for video ${videoId} resulted in an empty or null transcript.`);
            transcription = `AI speech-to-text for video ${videoId} resulted in an empty transcript. The audio might be silent or unclear.`;
          } else {
            console.log(`AI transcription successful for video ${videoId}.`);
          }
        } catch (error) {
          console.error(`AI transcription error for video ${videoId}:`, error);
          transcription = `AI speech-to-text transcription failed for video ${videoId}. Error: ${(error as Error).message}`;
        }
      } else {
        console.warn(`Audio for video ${videoId} could not be downloaded. Cannot perform AI transcription.`);
        transcription = `No pre-existing transcript found, and audio for video ${videoId} could not be downloaded for AI transcription.`;
      }
    }

    if (transcription === null || transcription === undefined) {
      // This case should ideally be handled by the specific messages above
      // but as a fallback to ensure a string is always returned.
      console.error(`Transcription for video ${videoId} is unexpectedly null/undefined at the end of the flow.`);
      transcription = "An unexpected error occurred, and no transcription could be obtained."
    }
    
    return {transcription};
  }
);
