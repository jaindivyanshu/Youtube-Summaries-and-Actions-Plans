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
    .describe('A structured, actionable plan derived from the video transcription, including practical tips and a SMART goal if possible.'),
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

Convert the following video transcription into a structured, actionable plan with prioritized steps.
The plan should be clear, concise, and easy to follow.
- Include practical tips for implementing each step of the plan.
- If possible, frame the overall plan around a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound) derived from the transcription content, or help define one. If a clear SMART goal isn't directly evident, suggest how the user might formulate one based on the video's key takeaways.

Transcription:
{{{transcription}}}`,
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
