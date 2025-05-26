// src/ai/flows/extract-actionable-items.ts
'use server';

/**
 * @fileOverview Extracts actionable items from a video transcription.
 *
 * - extractActionableItems - A function that extracts actionable items from the transcription.
 * - ExtractActionableItemsInput - The input type for the extractActionableItems function.
 * - ExtractActionableItemsOutput - The return type for the extractActionableItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractActionableItemsInputSchema = z.object({
  transcription: z.string().describe('The transcription of the video.'),
});

export type ExtractActionableItemsInput = z.infer<
  typeof ExtractActionableItemsInputSchema
>;

const ExtractActionableItemsOutputSchema = z.object({
  actionableItems: z
    .array(z.string())
    .describe('A list of actionable items extracted from the transcription.'),
});

export type ExtractActionableItemsOutput = z.infer<
  typeof ExtractActionableItemsOutputSchema
>;

export async function extractActionableItems(
  input: ExtractActionableItemsInput
): Promise<ExtractActionableItemsOutput> {
  return extractActionableItemsFlow(input);
}

const extractActionableItemsPrompt = ai.definePrompt({
  name: 'extractActionableItemsPrompt',
  input: {schema: ExtractActionableItemsInputSchema},
  output: {schema: ExtractActionableItemsOutputSchema},
  prompt: `You are an AI expert in extracting actionable items from text.

  Given the following video transcription, extract a list of actionable items. Actionable items should be specific and directly derived from the transcription.

  Transcription: {{{transcription}}}

  Actionable Items:`,
});

const extractActionableItemsFlow = ai.defineFlow(
  {
    name: 'extractActionableItemsFlow',
    inputSchema: ExtractActionableItemsInputSchema,
    outputSchema: ExtractActionableItemsOutputSchema,
  },
  async input => {
    const {output} = await extractActionableItemsPrompt(input);
    return output!;
  }
);
