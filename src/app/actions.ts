
'use server';

import { transcribeYouTubeVideo, type TranscribeYouTubeVideoInput, type TranscribeYouTubeVideoOutput } from '@/ai/flows/transcribe-youtube-video';
import { generateVideoSummary, type GenerateVideoSummaryInput, type GenerateVideoSummaryOutput } from '@/ai/flows/generate-video-summary';
import { extractActionableItems, type ExtractActionableItemsInput, type ExtractActionableItemsOutput } from '@/ai/flows/extract-actionable-items';
import { convertToPlan, type ConvertToPlanInput, type ConvertToPlanOutput } from '@/ai/flows/convert-to-actionable-plan';
import { analyzeTranscription, type AnalyzeTranscriptionInput, type AnalyzeTranscriptionOutput } from '@/ai/flows/analyze-transcription-flow';
import { transcribeUploadedAudio, type TranscribeUploadedAudioInput, type TranscribeUploadedAudioOutput } from '@/ai/flows/transcribe-uploaded-audio-flow';

export async function handleTranscribeVideo(input: TranscribeYouTubeVideoInput): Promise<TranscribeYouTubeVideoOutput> {
  try {
    const result = await transcribeYouTubeVideo(input);
    // Ensure transcription is a string, even if empty. If it's null/undefined, flow might have errored internally before returning.
    if (result && typeof result.transcription === 'string') {
      return result;
    }
    // If result is null or transcription is not a string, treat as an error or incomplete data.
    // The flow itself should throw for actual errors. This handles unexpected returns.
    console.warn('handleTranscribeVideo received unexpected result structure:', result);
    return { transcription: '' }; // Return empty string to indicate no usable transcript
  } catch (error) {
    console.error('Error in handleTranscribeVideo:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during YouTube video transcription.';
    // Return an error-like message or empty string for the UI to handle showing upload option
    return { transcription: `Error: ${errorMessage}` };
  }
}

export async function handleTranscribeUploadedAudio(input: TranscribeUploadedAudioInput): Promise<TranscribeUploadedAudioOutput> {
  try {
    const result = await transcribeUploadedAudio(input);
    if (!result || typeof result.transcription !== 'string') {
      throw new Error('Invalid transcription data received from uploaded audio.');
    }
    return result;
  } catch (error) {
    console.error('Error in handleTranscribeUploadedAudio:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during uploaded audio transcription.';
    throw new Error(`Failed to transcribe uploaded audio: ${errorMessage}`);
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

export async function handleAnalyzeTranscription(input: AnalyzeTranscriptionInput): Promise<AnalyzeTranscriptionOutput> {
  try {
    const result = await analyzeTranscription(input);
    if (!result || !Array.isArray(result.segments)) {
      throw new Error('Invalid analyzed transcription data received.');
    }
    return result;
  } catch (error) {
    console.error('Error in handleAnalyzeTranscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during transcription analysis.';
    // Fallback to non-highlighted if analysis fails
    return { segments: [{ text: input.transcription, highlight: false }] };
  }
}
