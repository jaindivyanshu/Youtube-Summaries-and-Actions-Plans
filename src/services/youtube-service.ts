
/**
 * @fileOverview YouTube service utilities.
 *
 * - getVideoId - Extracts the YouTube video ID from a URL.
 * - getTranscript - Fetches a video transcript using the youtube-transcript library.
 * - downloadAudioFromYouTube - Placeholder for downloading audio from a YouTube video.
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
    console.warn(`youtube-service: Failed to fetch English transcript for videoId ${videoId}. Error: ${(error as Error).message}`);
    return null; // Indicate transcript not available due to error
  }
}

/**
 * Placeholder function for downloading audio from a YouTube video.
 * In a real implementation, this would use a library like ytdl-core
 * to download the audio and return it as a data URI (e.g., "data:audio/mp3;base64,...").
 * @param videoId The YouTube video ID.
 * @returns A promise that resolves to the audio data URI, or null if download fails.
 */
export async function downloadAudioFromYouTube(videoId: string): Promise<string | null> {
  console.warn(`youtube-service: downloadAudioFromYouTube for videoId ${videoId} is a placeholder and did not actually download audio. Returning null.`);
  //
  // TODO: Implement actual audio download logic here.
  // Example using a hypothetical library:
  //
  // import ytdl from 'ytdl-core';
  // import { PassThrough } from 'stream';
  //
  // try {
  //   if (!ytdl.validateID(videoId)) {
  //     console.error(`youtube-service: Invalid videoId for audio download: ${videoId}`);
  //     return null;
  //   }
  //   const info = await ytdl.getInfo(videoId);
  //   const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
  //   if (!audioFormat) {
  //     console.error(`youtube-service: No suitable audio format found for videoId: ${videoId}`);
  //     return null;
  //   }
  //
  //   const audioStream = ytdl(videoId, { format: audioFormat });
  //   const chunks: Buffer[] = [];
  //
  //   return new Promise((resolve, reject) => {
  //     audioStream.on('data', (chunk) => chunks.push(chunk));
  //     audioStream.on('end', () => {
  //       const audioBuffer = Buffer.concat(chunks);
  //       const mimeType = audioFormat.mimeType?.split(';')[0] || 'audio/mp3'; // Determine MIME type
  //       const audioDataUri = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;
  //       resolve(audioDataUri);
  //     });
  //     audioStream.on('error', (err) => {
  //       console.error(`youtube-service: Error downloading audio for videoId ${videoId}:`, err);
  //       reject(null);
  //     });
  //   });
  // } catch (error) {
  //   console.error(`youtube-service: Exception during audio download for videoId ${videoId}:`, error);
  //   return null;
  // }
  return null; // Placeholder returns null
}
