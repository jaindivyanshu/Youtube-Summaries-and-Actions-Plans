
'use server';
/**
 * @fileOverview Transcribes an uploaded audio file.
 *
 * - transcribeUploadedAudio - A function that handles the audio file transcription process.
 * - TranscribeUploadedAudioInput - The input type for the transcribeUploadedAudio function.
 * - TranscribeUploadedAudioOutput - The return type for the transcribeUploadedAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeUploadedAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio file content as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeUploadedAudioInput = z.infer<
  typeof TranscribeUploadedAudioInputSchema
>;

const TranscribeUploadedAudioOutputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcription of the uploaded audio file.'),
});
export type TranscribeUploadedAudioOutput = z.infer<
  typeof TranscribeUploadedAudioOutputSchema
>;

export async function transcribeUploadedAudio(
  input: TranscribeUploadedAudioInput
): Promise<TranscribeUploadedAudioOutput> {
  return transcribeUploadedAudioFlow(input);
}

const transcribeUploadedAudioFlow = ai.defineFlow(
  {
    name: 'transcribeUploadedAudioFlow',
    inputSchema: TranscribeUploadedAudioInputSchema,
    outputSchema: TranscribeUploadedAudioOutputSchema,
  },
  async input => {
    if (!input.audioDataUri) {
      throw new Error('No audio data URI provided.');
    }

    try {
      const {text} = await ai.generate({
        model: 'googleai/gemini-1.5-flash', // Model supporting audio input
        prompt: [
          {media: {url: input.audioDataUri}},
          {text: 'Transcribe the audio accurately. Provide only the transcribed text.'},
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
      const transcription = text;
      if (transcription === null || transcription === undefined) {
         throw new Error('AI transcription resulted in an empty transcript.');
      }
      return {transcription};
    } catch (error) {
      console.error('AI transcription error for uploaded audio:', error);
      throw new Error(
        `AI transcription failed for uploaded audio. Error: ${(error as Error).message}`
      );
    }
  }
);
