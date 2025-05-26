'use server';

/**
 * @fileOverview Converts a video transcription into a structured, actionable plan.
 *
 * - convertToPlan - A function that converts video transcription to actionable plan.
 * - ConvertToPlanInput - The input type for the convertToPlan function.
 * - ConvertToPlanOutput - The return type for the convertToPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConvertToPlanInputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcription of the video to convert into an actionable plan.'),
});
export type ConvertToPlanInput = z.infer<typeof ConvertToPlanInputSchema>;

const ConvertToPlanOutputSchema = z.object({
  actionablePlan: z
    .string()
    .describe('A structured, actionable plan derived from the video transcription.'),
});
export type ConvertToPlanOutput = z.infer<typeof ConvertToPlanOutputSchema>;

export async function convertToPlan(input: ConvertToPlanInput): Promise<ConvertToPlanOutput> {
  return convertToPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'convertToPlanPrompt',
  input: {schema: ConvertToPlanInputSchema},
  output: {schema: ConvertToPlanOutputSchema},
  prompt: `You are an expert in creating actionable plans from transcriptions.

  Convert the following video transcription into a structured, actionable plan with prioritized steps. Be clear and concise.

  Transcription: {{{transcription}}}`,
});

const convertToPlanFlow = ai.defineFlow(
  {
    name: 'convertToPlanFlow',
    inputSchema: ConvertToPlanInputSchema,
    outputSchema: ConvertToPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
