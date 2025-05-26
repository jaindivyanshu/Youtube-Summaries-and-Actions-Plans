
'use server';
/**
 * @fileOverview Analyzes a video transcription to identify key segments for highlighting.
 *
 * - analyzeTranscription - A function that processes the transcription for highlighting.
 * - AnalyzeTranscriptionInput - The input type for the analyzeTranscription function.
 * - AnalyzeTranscriptionOutput - The return type for the analyzeTranscription function.
 * - HighlightSegment - Represents a segment of text and whether it should be highlighted.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTranscriptionInputSchema = z.object({
  transcription: z
    .string()
    .describe('The video transcription text to analyze.'),
});
export type AnalyzeTranscriptionInput = z.infer<
  typeof AnalyzeTranscriptionInputSchema
>;

const HighlightSegmentSchema = z.object({
  text: z.string().describe('A segment of the transcription text.'),
  highlight: z
    .boolean()
    .describe(
      'Whether this segment should be highlighted (e.g., bolded).'
    ),
});
export type HighlightSegment = z.infer<typeof HighlightSegmentSchema>;

const AnalyzeTranscriptionOutputSchema = z.object({
  segments: z
    .array(HighlightSegmentSchema)
    .describe(
      'An array of transcription segments, each with a highlight flag.'
    ),
});
export type AnalyzeTranscriptionOutput = z.infer<
  typeof AnalyzeTranscriptionOutputSchema
>;

export async function analyzeTranscription(
  input: AnalyzeTranscriptionInput
): Promise<AnalyzeTranscriptionOutput> {
  return analyzeTranscriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTranscriptionPrompt',
  input: {schema: AnalyzeTranscriptionInputSchema},
  output: {schema: AnalyzeTranscriptionOutputSchema},
  prompt: `You are an expert in text analysis. Your task is to process a video transcription and break it down into segments. For each segment, you need to determine if it should be highlighted (e.g., made bold) based on criteria like repetition of ideas, key takeaways, or phrases that likely indicate higher viewer attention or were delivered with emphasis.

The goal is to make the transcription easier to skim by emphasizing important parts.

Input: A string containing the video transcription.

Output: An array of objects, where each object represents a segment of the transcription. Each object should have two properties:
1.  \`text\`: The text content of the segment. Ensure the full transcription is covered and segments are contiguous.
2.  \`highlight\`: A boolean value (\`true\` if the segment should be highlighted, \`false\` otherwise).

The segments should cover the entire original transcription in order.
Focus on identifying genuinely important or emphatically delivered parts. Avoid highlighting too much; be selective. Repetitive phrases that reinforce a point, or summary statements, are good candidates for highlighting.

Transcription:
{{{transcription}}}
`,
});

const analyzeTranscriptionFlow = ai.defineFlow(
  {
    name: 'analyzeTranscriptionFlow',
    inputSchema: AnalyzeTranscriptionInputSchema,
    outputSchema: AnalyzeTranscriptionOutputSchema,
  },
  async input => {
    if (!input.transcription || input.transcription.trim() === '') {
      return { segments: [] };
    }
    try {
      const {output} = await prompt(input);
      if (!output || !output.segments) {
        // Fallback: return the original transcription as a single, non-highlighted segment
        return { segments: [{ text: input.transcription, highlight: false }] };
      }
      return output;
    } catch (error) {
      console.error("Error in analyzeTranscriptionFlow:", error);
      // Fallback on error
      return { segments: [{ text: input.transcription, highlight: false }] };
    }
  }
);
