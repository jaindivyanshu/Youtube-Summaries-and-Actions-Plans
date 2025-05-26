
# YT Video to Action

Unlock the potential of video content. Transcribe YouTube videos, analyze transcriptions for key insights, generate summaries, extract actionable items, and create structured plans—all powered by AI.

## Table of Contents

1.  [User Manual & Prerequisites](#user-manual--prerequisites)
    *   [Prerequisites](#prerequisites)
    *   [Getting Started](#getting-started)
    *   [Core Features](#core-features)
        *   [Processing a YouTube Video](#processing-a-youtube-video)
        *   [Uploading an Audio File](#uploading-an-audio-file)
        *   [Analyzing Transcription](#analyzing-transcription)
        *   [Generating Insights](#generating-insights)
    *   [API Key Management](#api-key-management)
2.  [High-Level Design](#high-level-design)
    *   [Technology Stack](#technology-stack)
    *   [Architecture Overview](#architecture-overview)
    *   [Data Flow](#data-flow)
3.  [Low-Level Design](#low-level-design)
    *   [Frontend Components](#frontend-components)
    *   [Backend (Server Actions & Genkit Flows)](#backend-server-actions--genkit-flows)
        *   [Key Genkit Flows](#key-genkit-flows)
        *   [Server Actions](#server-actions)
    *   [Services](#services)
4.  [Development](#development)
    *   [Running Locally](#running-locally)
5.  [Deployment](#deployment)

## User Manual & Prerequisites

### Prerequisites

1.  **Google AI API Key:** The application uses Google AI models (via Genkit) for transcription analysis, summarization, action item extraction, and plan generation. You will need a Google AI API Key.
    *   You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   This key needs to be configured in two ways:
        *   **For Server-Side AI Operations (Genkit):** The key must be available as an environment variable (e.g., `GOOGLE_API_KEY`) to the Node.js environment where the Genkit flows run. For local development, create a `.env` file in the project root and add `GOOGLE_API_KEY=your_actual_api_key`. For deployment (e.g., Firebase App Hosting), configure this as an environment variable in your hosting provider's settings.
        *   **For Client-Side Convenience (Optional but Recommended):** The application allows you to save this API key in your browser's local storage. This is for convenience and doesn't directly supply the key to the server-side flows but can be a reminder or for potential future client-side AI features.
2.  **Modern Web Browser:** Chrome, Firefox, Safari, Edge, etc.

### Getting Started

1.  Open the application in your web browser.
2.  **Set API Key (Recommended):**
    *   Click the **Settings** icon (gear icon) in the header.
    *   Enter your Google AI API Key in the dialog.
    *   Click "Save Key". This saves the key in your browser's local storage for future sessions.
    *   *Note: Ensure the API key is also set up in the server environment as per Prerequisites for the AI features to work.*

### Core Features

#### Processing a YouTube Video

1.  Locate the "Process YouTube Video" section.
2.  Enter the full URL of the YouTube video you want to process into the "YouTube URL" input field.
3.  Click the "Process Video" button.
4.  The application will attempt to:
    *   Fetch a pre-existing English transcript for the video.
    *   If no pre-existing transcript is found, it will attempt to download the video's audio and use an AI model to generate a transcript. (This requires `ytdl-core` to function correctly and the AI model to be available).
5.  The fetched or generated transcription will appear in the "Video Transcription" card.
    *   A word count for the transcription is displayed.
    *   If the transcription is long, you can scroll through it.
    *   You can copy the entire transcription using the "Copy" button.

#### Uploading an Audio File

If a transcript cannot be retrieved from the YouTube URL (e.g., video has no captions, or audio download fails), an "Upload Audio File" section will appear.

1.  Click the "Choose File" or similar button to select an audio file from your computer (e.g., MP3, WAV, M4A).
2.  Once a file is selected, its name will be displayed.
3.  Click the "Transcribe Uploaded Audio" button.
4.  The application will upload the audio and use an AI model to generate a transcription. This transcription will then populate the "Video Transcription" card.

#### Analyzing Transcription

Once a transcription is available (either from YouTube or an uploaded file):

1.  Click the "Analyze & Highlight" button located in the "Video Transcription" card header.
2.  The AI will analyze the transcription to identify key segments (based on repetition, emphasis, or likely importance).
3.  These key segments will be **bolded** in the transcription display, making it easier to skim for important information. This step is optional.

#### Generating Insights

Below the transcription card, the "Generate Insights" section becomes active. This section uses the current transcription (either raw or after analysis if performed) to generate further content.

1.  **Video Summary:**
    *   Optionally, enter custom instructions in the textarea (e.g., "Focus on the technical details", "Keep it under 150 words").
    *   Click "Generate Summary".
    *   The AI-generated summary will appear in a card below, with a word count and a "Copy" button.
2.  **Actionable Items:**
    *   Optionally, enter custom instructions in the textarea (e.g., "Extract items for a beginner", "Categorize by effort").
    *   Click "Extract Action Items".
    *   A list of AI-extracted actionable items will appear in a card below, with a "Copy" button.
3.  **Actionable Plan:**
    *   Click "Create Actionable Plan".
    *   The AI will generate a structured plan based on the transcription. The prompt guides the AI to include:
        *   Practical tips for implementing each step.
        *   Framing the overall plan around a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound) or helping the user define one.
    *   The plan will appear in a card below, with a word count and a "Copy" button.

### API Key Management

*   **Saving:** Use the Settings dialog (gear icon in the header) to enter and save your Google AI API Key in the browser's local storage.
*   **Clearing:** In the Settings dialog, you can click "Clear Key" to remove it from local storage.
*   **Security:** Remember that storing API keys in the browser is for convenience. For production, server-side environment variables are the secure standard for backend services like Genkit.

## High-Level Design

### Technology Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **AI Integration:** Genkit (with Google AI plugin, e.g., Gemini models)
*   **YouTube Transcript Fetching:** `youtube-transcript` library
*   **YouTube Audio Downloading (for AI transcription):** `ytdl-core` library
*   **Form Handling:** `react-hook-form` with `zod` for validation

### Architecture Overview

The application follows a client-server architecture:

1.  **Client (Browser):**
    *   Renders the UI using Next.js and React components.
    *   Handles user interactions (form submissions, button clicks).
    *   Makes requests to the backend via Next.js Server Actions.
    *   Stores the user-provided API key (for convenience) in `localStorage`.
2.  **Backend (Server-Side within Next.js):**
    *   **Next.js Server Actions (`src/app/actions.ts`):** Act as the bridge between the frontend and the AI logic. They receive requests from the client and invoke Genkit flows.
    *   **Genkit Flows (`src/ai/flows/*.ts`):** Orchestrate calls to AI models (e.g., Google Gemini) for tasks like transcription analysis, summarization, etc. These flows are defined using Genkit's SDK and are responsible for prompting the LLMs and structuring their output.
    *   **Services (`src/services/youtube-service.ts`):** Contain utility functions, such as extracting video IDs, fetching transcripts using `youtube-transcript`, and downloading audio using `ytdl-core`.

### Data Flow

**Typical Transcription & Insight Generation Flow:**

1.  **User submits YouTube URL** (Client) -> `YoutubeUrlForm` (`page.tsx`)
2.  `processVideo` function called (Client - `page.tsx`)
3.  `handleTranscribeVideo` Server Action invoked (Client -> Server - `actions.ts`)
4.  `transcribeYouTubeVideo` Genkit Flow executed (Server - `transcribe-youtube-video.ts`)
    *   Calls `getVideoId` (Server - `youtube-service.ts`)
    *   Calls `getTranscript` (Server - `youtube-service.ts` using `youtube-transcript` library)
    *   If transcript not found:
        *   Calls `downloadAudioFromYouTube` (Server - `youtube-service.ts` using `ytdl-core`)
        *   If audio downloaded, calls `ai.generate` (Gemini model via Genkit) to transcribe audio.
5.  Transcription result returned to Server Action -> Client (`page.tsx`)
6.  Transcription displayed (Client).
7.  **User clicks "Analyze & Highlight"** (Client)
8.  `handleAnalyzeTranscription` Server Action invoked (Client -> Server - `actions.ts`)
9.  `analyzeTranscriptionFlow` Genkit Flow executed (Server - `analyze-transcription-flow.ts`)
    *   Calls `ai.definePrompt` to instruct LLM on how to segment and highlight.
10. Analyzed segments returned to Server Action -> Client (`page.tsx`)
11. Highlighted transcription displayed (Client).
12. **User clicks "Generate Summary"** (Client)
13. `handleGenerateSummary` Server Action invoked (Client -> Server - `actions.ts`)
14. `generateVideoSummary` Genkit Flow executed (Server - `generate-video-summary.ts` with optional custom instruction)
15. Summary returned -> Client (`page.tsx`)
16. Summary displayed (Client).
    *(Similar flow for Action Items and Actionable Plan)*

**Audio Upload Flow:**

1.  If YouTube URL processing fails to yield a transcript, UI for audio upload appears (Client - `page.tsx`).
2.  User selects an audio file (Client).
3.  File is read as Data URI (Client).
4.  **User clicks "Transcribe Uploaded Audio"** (Client).
5.  `handleTranscribeUploadedAudio` Server Action invoked (Client -> Server - `actions.ts`)
6.  `transcribeUploadedAudioFlow` Genkit Flow executed (Server - `transcribe-uploaded-audio-flow.ts`)
    *   Calls `ai.generate` (Gemini model via Genkit) with the audio data URI.
7.  Transcription result returned to Server Action -> Client (`page.tsx`)
8.  Transcription displayed (Client). Subsequent insight generation uses this transcript.

## Low-Level Design

### Frontend Components

Located primarily in `src/app/page.tsx` and `src/components/actionable-insights/`:

*   **`src/app/page.tsx`:** The main page component. Manages overall application state (transcription, summary, errors, loading states, API key, etc.), orchestrates calls to server actions, and renders the UI structure using ShadCN components.
*   **`src/components/actionable-insights/AppHeader.tsx`:** Displays the application title and provides a settings button for API key management.
*   **`src/components/actionable-insights/YoutubeUrlForm.tsx`:** A form component for YouTube URL input, using `react-hook-form` and `zod` for validation.
*   **`src/components/actionable-insights/LoadingSpinner.tsx`:** A reusable loading spinner.
*   **`src/components/actionable-insights/CopyToClipboardButton.tsx`:** A reusable button to copy text to the clipboard, providing user feedback via toasts.
*   **ShadCN UI Components (`src/components/ui/`):** Pre-built, customizable UI components like `Button`, `Card`, `Input`, `Dialog`, `ScrollArea`, `Textarea`, `Alert`, `Separator`, `Label`, `Toast`.

### Backend (Server Actions & Genkit Flows)

#### Key Genkit Flows (`src/ai/flows/`)

*   **`transcribe-youtube-video.ts`:**
    *   Input: `youtubeUrl: string`
    *   Output: `transcription: string`
    *   Orchestrates fetching existing transcripts via `youtube-transcript` or, if unavailable, attempts to download audio via `ytdl-core` and then uses a Gemini model for speech-to-text.
*   **`transcribe-uploaded-audio-flow.ts`:**
    *   Input: `audioDataUri: string`
    *   Output: `transcription: string`
    *   Uses a Gemini model to transcribe audio provided as a data URI.
*   **`analyze-transcription-flow.ts`:**
    *   Input: `transcription: string`
    *   Output: `{ segments: [{ text: string, highlight: boolean }] }`
    *   Prompts an LLM to break down the transcription into segments and flag important ones for highlighting.
*   **`generate-video-summary.ts`:**
    *   Input: `transcript: string, customInstruction?: string`
    *   Output: `summary: string`
    *   Prompts an LLM to summarize the transcript, optionally considering custom user instructions.
*   **`extract-actionable-items.ts`:**
    *   Input: `transcription: string, customInstruction?: string`
    *   Output: `actionableItems: string[]`
    *   Prompts an LLM to extract a list of actionable items from the transcription, with optional custom instructions.
*   **`convert-to-actionable-plan.ts`:**
    *   Input: `transcription: string`
    *   Output: `actionablePlan: string`
    *   Prompts an LLM to create a structured, actionable plan, including practical tips and framing around a SMART goal.

#### Server Actions (`src/app/actions.ts`)

These functions are marked with `'use server'` and act as the entry points from the client to the backend Genkit flows. Each action typically:
1.  Takes input from the client.
2.  Calls the corresponding Genkit flow function.
3.  Handles potential errors.
4.  Returns the result (or error information) to the client.

*   `handleTranscribeVideo(input: TranscribeYouTubeVideoInput)`
*   `handleTranscribeUploadedAudio(input: TranscribeUploadedAudioInput)`
*   `handleGenerateSummary(input: GenerateVideoSummaryInput)`
*   `handleExtractActionItems(input: ExtractActionableItemsInput)`
*   `handleCreateActionablePlan(input: ConvertToPlanInput)`
*   `handleAnalyzeTranscription(input: AnalyzeTranscriptionInput)`

### Services

*   **`src/services/youtube-service.ts`:**
    *   `getVideoId(url: string): string | null`: Extracts video ID from a YouTube URL.
    *   `getTranscript(videoId: string): Promise<string | null>`: Uses `youtube-transcript` library to fetch existing English transcripts.
    *   `downloadAudioFromYouTube(videoId: string): Promise<string | null>`: Uses `ytdl-core` to download audio from a YouTube video and returns it as a data URI. Includes error handling and format selection.

## Development

### Running Locally

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    *   Create a `.env` file in the project root.
    *   Add your Google AI API Key:
        ```
        GOOGLE_API_KEY=your_actual_google_ai_api_key
        ```
4.  **Run the Genkit development server (in a separate terminal):**
    This starts the Genkit tool and makes your flows available.
    ```bash
    npm run genkit:watch
    ```
5.  **Run the Next.js development server (in another terminal):**
    ```bash
    npm run dev
    ```
6.  Open your browser and navigate to `http://localhost:9002` (or the port Next.js starts on).

## Deployment

This application is configured for deployment using **Firebase App Hosting**, as indicated by the `apphosting.yaml` file.

1.  **Install Firebase CLI:**
    ```bash
    npm install -g firebase-tools
    ```
2.  **Login to Firebase:**
    ```bash
    firebase login
    ```
3.  **Initialize Firebase in your project (if not already done):**
    ```bash
    firebase init
    ```
    Follow the prompts, selecting "App Hosting".
4.  **Configure Environment Variables in Firebase:**
    Before deploying, ensure your `GOOGLE_API_KEY` is set as an environment variable in your Firebase App Hosting backend configuration. This is crucial for the deployed AI flows to function.
5.  **Deploy:**
    ```bash
    firebase deploy
    ```

Alternatively, platforms like **Vercel** or **Netlify** are excellent for deploying Next.js applications and offer easy integration with GitHub repositories.

*GitHub Pages is NOT suitable for this application due to its server-side functionalities (Server Actions, Genkit flows).*
