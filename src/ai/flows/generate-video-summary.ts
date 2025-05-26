'use server';
/**
 * @fileOverview A video summary generation AI agent.
 *
 * - generateVideoSummary - A function that handles the video summary generation process.
 * - GenerateVideoSummaryInput - The input type for the generateVideoSummary function.
 * - GenerateVideoSummaryOutput - The return type for the generateVideoSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVideoSummaryInputSchema = z.object({
  transcript: z.string().describe('The transcript of the video.'),
  customInstruction: z.string().optional().describe('Optional custom instruction for the summarization process.'),
});
export type GenerateVideoSummaryInput = z.infer<typeof GenerateVideoSummaryInputSchema>;

const GenerateVideoSummaryOutputSchema = z.object({
  summary: z.string().describe('The summary of the video.'),
});
export type GenerateVideoSummaryOutput = z.infer<typeof GenerateVideoSummaryOutputSchema>;

export async function generateVideoSummary(input: GenerateVideoSummaryInput): Promise<GenerateVideoSummaryOutput> {
  return generateVideoSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateVideoSummaryPrompt',
  input: {schema: GenerateVideoSummaryInputSchema},
  output: {schema: GenerateVideoSummaryOutputSchema},
  prompt: `You are an expert summarizer. Please summarize the following video transcript in a concise manner.
{{#if customInstruction}}
Additionally, follow this specific instruction: {{{customInstruction}}}
{{/if}}

Transcript:
{{{transcript}}}`,
});

const generateVideoSummaryFlow = ai.defineFlow(
  {
    name: 'generateVideoSummaryFlow',
    inputSchema: GenerateVideoSummaryInputSchema,
    outputSchema: GenerateVideoSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
