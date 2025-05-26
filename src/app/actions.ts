'use server';

import { transcribeYouTubeVideo, type TranscribeYouTubeVideoInput, type TranscribeYouTubeVideoOutput } from '@/ai/flows/transcribe-youtube-video';
import { generateVideoSummary, type GenerateVideoSummaryInput, type GenerateVideoSummaryOutput } from '@/ai/flows/generate-video-summary';
import { extractActionableItems, type ExtractActionableItemsInput, type ExtractActionableItemsOutput } from '@/ai/flows/extract-actionable-items';
import { convertToPlan, type ConvertToPlanInput, type ConvertToPlanOutput } from '@/ai/flows/convert-to-actionable-plan';

export async function handleTranscribeVideo(input: TranscribeYouTubeVideoInput): Promise<TranscribeYouTubeVideoOutput> {
  try {
    const result = await transcribeYouTubeVideo(input);
    if (!result || typeof result.transcription !== 'string') {
      throw new Error('Invalid transcription data received.');
    }
    return result;
  } catch (error) {
    console.error('Error in handleTranscribeVideo:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during transcription.';
    throw new Error(`Failed to transcribe video: ${errorMessage}`);
  }
}

export async function handleGenerateSummary(input: GenerateVideoSummaryInput): Promise<GenerateVideoSummaryOutput> {
  try {
    const result = await generateVideoSummary(input);
     if (!result || typeof result.summary !== 'string') {
      throw new Error('Invalid summary data received.');
    }
    return result;
  } catch (error) {
    console.error('Error in handleGenerateSummary:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during summary generation.';
    throw new Error(`Failed to generate summary: ${errorMessage}`);
  }
}

export async function handleExtractActionItems(input: ExtractActionableItemsInput): Promise<ExtractActionableItemsOutput> {
  try {
    const result = await extractActionableItems(input);
    if (!result || !Array.isArray(result.actionableItems)) {
      throw new Error('Invalid actionable items data received.');
    }
    return result;
  } catch (error) {
    console.error('Error in handleExtractActionItems:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during action item extraction.';
    throw new Error(`Failed to extract action items: ${errorMessage}`);
  }
}

export async function handleCreateActionablePlan(input: ConvertToPlanInput): Promise<ConvertToPlanOutput> {
  try {
    const result = await convertToPlan(input);
    if (!result || typeof result.actionablePlan !== 'string') {
      throw new Error('Invalid actionable plan data received.');
    }
    return result;
  } catch (error) {
    console.error('Error in handleCreateActionablePlan:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during plan creation.';
    throw new Error(`Failed to create actionable plan: ${errorMessage}`);
  }
}
