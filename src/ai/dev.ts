
import { config } from 'dotenv';
config();

import '@/ai/flows/convert-to-actionable-plan.ts';
import '@/ai/flows/transcribe-youtube-video.ts';
import '@/ai/flows/extract-actionable-items.ts';
import '@/ai/flows/generate-video-summary.ts';
import '@/ai/flows/analyze-transcription-flow.ts';
