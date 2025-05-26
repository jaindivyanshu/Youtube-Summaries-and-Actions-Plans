
/**
 * @fileOverview YouTube service utilities.
 *
 * - getVideoId - Extracts the YouTube video ID from a URL.
 * - getTranscript - Fetches a video transcript using the youtube-transcript library.
 * - downloadAudioFromYouTube - Downloads audio from a YouTube video using ytdl-core.
 */

import { YoutubeTranscript, type TranscriptResponse } from 'youtube-transcript';
import ytdl from 'ytdl-core';
import { PassThrough } from 'stream';

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
 * Downloads audio from a YouTube video and returns it as a data URI.
 * @param videoId The YouTube video ID.
 * @returns A promise that resolves to the audio data URI, or null if download fails.
 */
export async function downloadAudioFromYouTube(videoId: string): Promise<string | null> {
  if (!videoId) {
    console.error('youtube-service: No videoId provided to downloadAudioFromYouTube.');
    return null;
  }
  console.log(`youtube-service: Attempting to download audio for videoId ${videoId}.`);
  try {
    if (!ytdl.validateID(videoId)) {
      console.error(`youtube-service: Invalid videoId for audio download: ${videoId}`);
      return null;
    }
    const info = await ytdl.getInfo(videoId);
    // Prefer audio-only formats. 'highestaudio' is a good general choice.
    // Some videos might offer 'audio/mp4' (m4a) or 'audio/webm'.
    // Gemini models generally support common formats like MP3, WAV, M4A, OGG.
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

    if (!audioFormat) {
      console.error(`youtube-service: No suitable audio-only format found for videoId: ${videoId}`);
      // Fallback to a format that might contain audio, though less ideal
      const mixedFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
      if (!mixedFormat || !mixedFormat.hasAudio) {
        console.error(`youtube-service: No format with audio found for videoId: ${videoId}`);
        return null;
      }
      console.warn(`youtube-service: Using mixed format for videoId: ${videoId} as no audio-only format was found. MIME: ${mixedFormat.mimeType}`);
      // It's better to use audioFormat here, but this is a fallback logic branch
      // Re-assign to audioFormat if we decide to proceed with a mixed format
      // For now, let's stick to requiring an audio-only or primarily audio stream.
      // If no 'audioonly' format is found, it's safer to return null for this function's purpose.
      return null;
    }

    console.log(`youtube-service: Selected audio format for ${videoId}:itag=${audioFormat.itag} mimeType=${audioFormat.mimeType} container=${audioFormat.container}`);

    const audioStream = ytdl(videoId, { format: audioFormat });
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      audioStream.on('end', () => {
        if (chunks.length === 0) {
          console.error(`youtube-service: Audio download for videoId ${videoId} resulted in empty data.`);
          return reject(null);
        }
        const audioBuffer = Buffer.concat(chunks);
        // Determine MIME type. ytdl-core gives mimeType like 'audio/mp4; codecs="mp4a.40.2"'
        // We just need the 'audio/mp4' part for the data URI.
        const mimeType = audioFormat.mimeType?.split(';')[0] || 'audio/mp3'; // Default to audio/mp3 if parsing fails
        const audioDataUri = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;
        console.log(`youtube-service: Audio for videoId ${videoId} downloaded and converted to data URI. Length: ${audioDataUri.length}`);
        resolve(audioDataUri);
      });
      audioStream.on('error', (err) => {
        console.error(`youtube-service: Error downloading audio stream for videoId ${videoId}:`, err);
        reject(null);
      });
    });
  } catch (error) {
    console.error(`youtube-service: Exception during audio download processing for videoId ${videoId}:`, error);
    return null;
  }
}
