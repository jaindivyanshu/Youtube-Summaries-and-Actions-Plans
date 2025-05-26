
/**
 * @fileOverview YouTube service utilities.
 *
 * - getVideoId - Extracts the YouTube video ID from a URL.
 * - getTranscript - Fetches a video transcript using the youtube-transcript library.
 */

import { YoutubeTranscript, type TranscriptResponse } from 'youtube-transcript';

/**
 * Extracts the YouTube video ID from various URL formats.
 * @param url The YouTube URL.
 * @returns The video ID, or null if not found.
 */
export function getVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Fetches an English transcript for a given video ID using the youtube-transcript library.
 * @param videoId The YouTube video ID.
 * @returns A promise that resolves to the transcript string, or null if not available or an error occurs.
 */
export async function getTranscript(videoId: string): Promise<string | null> {
  if (!videoId) {
    console.error('youtube-service: No videoId provided to getTranscript.');
    return null;
  }
  try {
    // Request English transcript specifically
    const transcriptItems: TranscriptResponse[] = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    if (transcriptItems && transcriptItems.length > 0) {
      return transcriptItems.map(item => item.text).join(' ');
    }
    console.warn(`youtube-service: No English transcript items found for videoId: ${videoId} (the library returned an empty array or similar).`);
    return null; // No transcript items returned by the library
  } catch (error: any) {
    // The youtube-transcript library typically throws an error if no transcript is found
    // or if the video ID is invalid/video does not exist.
    // Example error messages: "No transcript found for this video_id" or "This video has no subtitled translations."
    console.warn(`youtube-service: Failed to fetch English transcript for videoId ${videoId}. Error: ${error.message}`);
    return null; // Indicate transcript not available due to error
  }
}

