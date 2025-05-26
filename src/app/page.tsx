
'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/actionable-insights/AppHeader';
import { YoutubeUrlForm } from '@/components/actionable-insights/YoutubeUrlForm';
import { LoadingSpinner } from '@/components/actionable-insights/LoadingSpinner';
import { CopyToClipboardButton } from '@/components/actionable-insights/CopyToClipboardButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  handleTranscribeVideo,
  handleGenerateSummary,
  handleExtractActionItems,
  handleCreateActionablePlan,
  handleAnalyzeTranscription,
} from './actions';
import type { TranscribeYouTubeVideoOutput } from '@/ai/flows/transcribe-youtube-video';
import type { GenerateVideoSummaryOutput } from '@/ai/flows/generate-video-summary';
import type { ExtractActionableItemsOutput } from '@/ai/flows/extract-actionable-items';
import type { ConvertToPlanOutput } from '@/ai/flows/convert-to-actionable-plan';
import type { AnalyzeTranscriptionOutput, HighlightSegment } from '@/ai/flows/analyze-transcription-flow';
import { ClipboardList, FileText, ListChecks, Loader2, ScrollText, AlertCircle, Copy } from 'lucide-react';

type YoutubeUrlFormValues = { youtubeUrl: string };

interface LoadingStates {
  transcribeAndAnalyze: boolean; // Combined state for transcription and analysis
  summary: boolean;
  actionItems: boolean;
  actionablePlan: boolean;
}

interface ErrorMessages {
  transcribeAndAnalyze: string | null;
  summary: string | null;
  actionItems: string | null;
  actionablePlan: string | null;
}

export default function ActionableInsightsPage() {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [analyzedTranscriptionOutput, setAnalyzedTranscriptionOutput] = useState<AnalyzeTranscriptionOutput | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<string[] | null>(null);
  const [actionablePlan, setActionablePlan] = useState<string | null>(null);

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    transcribeAndAnalyze: false,
    summary: false,
    actionItems: false,
    actionablePlan: false,
  });

  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({
    transcribeAndAnalyze: null,
    summary: null,
    actionItems: null,
    actionablePlan: null,
  });

  const { toast } = useToast();

  const countWords = (text: string | null): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const resetResults = () => {
    setTranscription(null);
    setAnalyzedTranscriptionOutput(null);
    setSummary(null);
    setActionItems(null);
    setActionablePlan(null);
    setErrorMessages({ transcribeAndAnalyze: null, summary: null, actionItems: null, actionablePlan: null });
  };

  const processVideo = async (data: YoutubeUrlFormValues) => {
    resetResults();
    setLoadingStates(prev => ({ ...prev, transcribeAndAnalyze: true }));
    setErrorMessages(prev => ({ ...prev, transcribeAndAnalyze: null }));

    try {
      const transcribeResult: TranscribeYouTubeVideoOutput = await handleTranscribeVideo({ youtubeUrl: data.youtubeUrl });
      setTranscription(transcribeResult.transcription);
      
      const videoId = extractVideoId(data.youtubeUrl);
      const placeholderMessagePattern = /Transcription not available for video id: \w+|Automated transcription for video ID \w+ is not yet implemented/;


      if (transcribeResult.transcription && !placeholderMessagePattern.test(transcribeResult.transcription)) {
        toast({ title: 'Transcription Successful', description: 'Analyzing transcription for key insights...' });
        try {
          const analysisResult: AnalyzeTranscriptionOutput = await handleAnalyzeTranscription({ transcription: transcribeResult.transcription });
          setAnalyzedTranscriptionOutput(analysisResult);
          toast({ title: 'Analysis Complete', description: 'Transcription analyzed and ready for review.' });
        } catch (analysisError: any) {
          console.error("Transcription analysis error:", analysisError);
          // If analysis fails, we still have the raw transcription.
          // Set a non-highlighted version or show raw.
          setAnalyzedTranscriptionOutput({ segments: [{ text: transcribeResult.transcription, highlight: false }] });
          toast({ variant: 'default', title: 'Analysis Partially Failed', description: 'Displaying raw transcription. Analysis could not be completed.' });
        }
      } else if (transcribeResult.transcription && placeholderMessagePattern.test(transcribeResult.transcription)) {
         // Handle placeholder messages specifically
        setAnalyzedTranscriptionOutput({ segments: [{ text: transcribeResult.transcription, highlight: false }] }); // Show placeholder as is
        toast({
          title: "Transcription Note",
          description: "Automated transcription was not available or not yet implemented for this video.",
          variant: "default",
          duration: 7000,
        });
      } else {
        // This case should ideally not be hit if errors are thrown properly
        throw new Error('Empty or invalid transcription received.');
      }

    } catch (error: any) {
      console.error("Transcription or Analysis error:", error);
      const message = error.message || 'Failed to process video.';
      setErrorMessages(prev => ({ ...prev, transcribeAndAnalyze: message }));
      toast({ variant: 'destructive', title: 'Processing Failed', description: message });
      // Ensure transcription state is also cleared or handled if it was partially set
      setTranscription(prev => prev || "Error during processing."); // Keep existing transcription if any, or set error
      setAnalyzedTranscriptionOutput({ segments: [{ text: transcription || "Error during processing.", highlight: false }] });
    } finally {
      setLoadingStates(prev => ({ ...prev, transcribeAndAnalyze: false }));
    }
  };

  const generateSummary = async () => {
    if (!transcription) return;
    setLoadingStates(prev => ({ ...prev, summary: true }));
    setErrorMessages(prev => ({ ...prev, summary: null }));
    setSummary(null);
    try {
      const result: GenerateVideoSummaryOutput = await handleGenerateSummary({ transcript: transcription });
      setSummary(result.summary);
      toast({ title: 'Summary Generated', description: 'Video summary created successfully.' });
    } catch (error: any) {
      setErrorMessages(prev => ({ ...prev, summary: error.message || 'Failed to generate summary.' }));
      toast({ variant: 'destructive', title: 'Summary Generation Failed', description: error.message || 'An unknown error occurred.' });
    } finally {
      setLoadingStates(prev => ({ ...prev, summary: false }));
    }
  };

  const extractActionItemsList = async () => {
    if (!transcription) return;
    setLoadingStates(prev => ({ ...prev, actionItems: true }));
    setErrorMessages(prev => ({ ...prev, actionItems: null }));
    setActionItems(null);
    try {
      const result: ExtractActionableItemsOutput = await handleExtractActionItems({ transcription: transcription });
      setActionItems(result.actionableItems);
      toast({ title: 'Action Items Extracted', description: 'Actionable items identified.' });
    } catch (error: any) {
      setErrorMessages(prev => ({ ...prev, actionItems: error.message || 'Failed to extract action items.' }));
      toast({ variant: 'destructive', title: 'Action Item Extraction Failed', description: error.message || 'An unknown error occurred.' });
    } finally {
      setLoadingStates(prev => ({ ...prev, actionItems: false }));
    }
  };

  const createActionablePlan = async () => {
    if (!transcription) return;
    setLoadingStates(prev => ({ ...prev, actionablePlan: true }));
    setErrorMessages(prev => ({ ...prev, actionablePlan: null }));
    setActionablePlan(null);
    try {
      const result: ConvertToPlanOutput = await handleCreateActionablePlan({ transcription: transcription });
      setActionablePlan(result.actionablePlan);
      toast({ title: 'Actionable Plan Created', description: 'An actionable plan has been generated.' });
    } catch (error: any) {
      setErrorMessages(prev => ({ ...prev, actionablePlan: error.message || 'Failed to create actionable plan.' }));
      toast({ variant: 'destructive', title: 'Plan Creation Failed', description: error.message || 'An unknown error occurred.' });
    } finally {
      setLoadingStates(prev => ({ ...prev, actionablePlan: false }));
    }
  };
  
  const extractVideoId = (url: string): string | null => {
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^?]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
  };


  return (
    <div className="flex flex-col items-center min-h-screen py-6 sm:py-10 px-4 bg-background text-foreground">
      <AppHeader />
      <main className="w-full max-w-3xl mt-8 space-y-6">
        <YoutubeUrlForm onSubmit={processVideo} isLoading={loadingStates.transcribeAndAnalyze} />

        {errorMessages.transcribeAndAnalyze && (
          <Alert variant="destructive" className="shadow-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Processing Error</AlertTitle>
            <AlertDescription>{errorMessages.transcribeAndAnalyze}</AlertDescription>
          </Alert>
        )}

        {loadingStates.transcribeAndAnalyze && <LoadingSpinner className="my-8" />}

        {(transcription || (analyzedTranscriptionOutput && analyzedTranscriptionOutput.segments.length > 0)) && !loadingStates.transcribeAndAnalyze && (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Transcription
                </CardTitle>
                <CopyToClipboardButton textToCopy={transcription} buttonText="Copy" size="sm" variant="ghost"/>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60 w-full rounded-md border p-4 bg-muted/30">
                <div className="text-sm whitespace-pre-wrap break-words">
                  {analyzedTranscriptionOutput && analyzedTranscriptionOutput.segments.length > 0 ? (
                    analyzedTranscriptionOutput.segments.map((segment, index) => (
                      <span key={index} className={segment.highlight ? 'font-semibold text-accent-foreground bg-accent/30 px-0.5 rounded-sm' : ''}>
                        {segment.text}
                      </span>
                    ))
                  ) : (
                    transcription 
                  )}
                </div>
              </ScrollArea>
              {transcription && (
                <p className="text-sm text-muted-foreground mt-3">
                  Word count: {countWords(transcription)}
                </p>
              )}
            </CardContent>
             <CardFooter className="p-4 pt-0">
              <CardDescription>
                Review the transcription. Highlighted sections indicate key parts identified by AI.
              </CardDescription>
            </CardFooter>
          </Card>
        )}

        {transcription && !loadingStates.transcribeAndAnalyze && (
          <>
            <Separator className="my-8" />
            <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Generate Insights</CardTitle>
                  <CardDescription>Use the transcription to generate summaries, action items, or a detailed plan.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button onClick={generateSummary} disabled={loadingStates.summary || !transcription} className="w-full">
                  {loadingStates.summary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScrollText className="mr-2 h-4 w-4" />}
                  Generate Summary
                </Button>
                <Button onClick={extractActionItemsList} disabled={loadingStates.actionItems || !transcription} className="w-full">
                  {loadingStates.actionItems ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
                  Extract Action Items
                </Button>
                <Button onClick={createActionablePlan} disabled={loadingStates.actionablePlan || !transcription} className="w-full">
                  {loadingStates.actionablePlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
                  Create Actionable Plan
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        
        <div className="space-y-6">
          {loadingStates.summary && <Card className="shadow-md"><CardContent className="p-6"><LoadingSpinner /></CardContent></Card>}
          {errorMessages.summary && (
            <Alert variant="destructive" className="shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Summary Error</AlertTitle>
              <AlertDescription>{errorMessages.summary}</AlertDescription>
            </Alert>
          )}
          {summary && !loadingStates.summary && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <ScrollText className="mr-2 h-5 w-5 text-primary" />
                    Video Summary
                  </CardTitle>
                  <CopyToClipboardButton textToCopy={summary} buttonText="Copy" size="sm" variant="ghost" />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap break-words">{summary}</p>
                </ScrollArea>
                 {summary && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Word count: {countWords(summary)}
                    </p>
                  )}
              </CardContent>
            </Card>
          )}

          {loadingStates.actionItems && <Card className="shadow-md"><CardContent className="p-6"><LoadingSpinner /></CardContent></Card>}
          {errorMessages.actionItems && (
            <Alert variant="destructive" className="shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Items Error</AlertTitle>
              <AlertDescription>{errorMessages.actionItems}</AlertDescription>
            </Alert>
          )}
          {actionItems && !loadingStates.actionItems && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <ListChecks className="mr-2 h-5 w-5 text-primary" />
                    Actionable Items
                  </CardTitle>
                   <CopyToClipboardButton textToCopy={actionItems.join('\n')} buttonText="Copy" size="sm" variant="ghost" />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/30">
                  {actionItems.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1.5">
                      {actionItems.map((item, index) => (
                        <li key={index} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  ) : (
                     <p className="text-sm text-muted-foreground">No actionable items found.</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {loadingStates.actionablePlan && <Card className="shadow-md"><CardContent className="p-6"><LoadingSpinner /></CardContent></Card>}
          {errorMessages.actionablePlan && (
            <Alert variant="destructive" className="shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Actionable Plan Error</AlertTitle>
              <AlertDescription>{errorMessages.actionablePlan}</AlertDescription>
            </Alert>
          )}
          {actionablePlan && !loadingStates.actionablePlan && (
            <Card className="shadow-lg">
              <CardHeader>
                 <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <ClipboardList className="mr-2 h-5 w-5 text-primary" />
                      Actionable Plan
                    </CardTitle>
                    <CopyToClipboardButton textToCopy={actionablePlan} buttonText="Copy" size="sm" variant="ghost" />
                  </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60 w-full rounded-md border p-4 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap break-words">{actionablePlan}</p>
                </ScrollArea>
                 {actionablePlan && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Word count: {countWords(actionablePlan)}
                    </p>
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Actionable Insights. All rights reserved.</p>
        <p>Powered by Genkit and Next.js.</p>
      </footer>
    </div>
  );
}
