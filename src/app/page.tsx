
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import type { AnalyzeTranscriptionOutput } from '@/ai/flows/analyze-transcription-flow';
import { ClipboardList, FileText, ListChecks, Loader2, ScrollText, AlertCircle, Sparkles, MessageSquarePlus } from 'lucide-react';

type YoutubeUrlFormValues = { youtubeUrl: string };

interface LoadingStates {
  transcribe: boolean;
  analysis: boolean;
  summary: boolean;
  actionItems: boolean;
  actionablePlan: boolean;
}

interface ErrorMessages {
  transcribe: string | null;
  analysis: string | null;
  summary: string | null;
  actionItems: string | null;
  actionablePlan: string | null;
}

export default function ActionableInsightsPage() {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [transcription, setTranscription] = useState<string | null>(null);
  const [analyzedTranscriptionOutput, setAnalyzedTranscriptionOutput] = useState<AnalyzeTranscriptionOutput | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<string[] | null>(null);
  const [actionablePlan, setActionablePlan] = useState<string | null>(null);

  const [summaryInstruction, setSummaryInstruction] = useState<string>('');
  const [actionItemsInstruction, setActionItemsInstruction] = useState<string>('');

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    transcribe: false,
    analysis: false,
    summary: false,
    actionItems: false,
    actionablePlan: false,
  });

  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({
    transcribe: null,
    analysis: null,
    summary: null,
    actionItems: null,
    actionablePlan: null,
  });

  const { toast } = useToast();

  const countWords = (text: string | null): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const resetResults = (fullReset: boolean = true) => {
    if (fullReset) {
      setTranscription(null);
      setYoutubeUrl('');
    }
    setAnalyzedTranscriptionOutput(null);
    setSummary(null);
    setActionItems(null);
    setActionablePlan(null);
    setSummaryInstruction('');
    setActionItemsInstruction('');
    setErrorMessages({ transcribe: null, analysis: null, summary: null, actionItems: null, actionablePlan: null });
  };

  const processVideo = async (data: YoutubeUrlFormValues) => {
    resetResults();
    setYoutubeUrl(data.youtubeUrl);
    setLoadingStates(prev => ({ ...prev, transcribe: true }));
    setErrorMessages(prev => ({ ...prev, transcribe: null, analysis: null }));

    try {
      const transcribeResult: TranscribeYouTubeVideoOutput = await handleTranscribeVideo({ youtubeUrl: data.youtubeUrl });
      setTranscription(transcribeResult.transcription);
      
      const placeholderMessagePattern = /Transcription not available for video id: \w+|Automated transcription for video ID \w+ is not yet implemented/;
      if (transcribeResult.transcription && placeholderMessagePattern.test(transcribeResult.transcription)) {
        toast({
          title: "Transcription Note",
          description: "Automated transcription was not available or not yet implemented for this video.",
          variant: "default",
          duration: 7000,
        });
      } else if (transcribeResult.transcription) {
        toast({ title: 'Transcription Successful', description: 'Transcription ready.' });
      } else {
        throw new Error('Empty or invalid transcription received.');
      }

    } catch (error: any) {
      console.error("Transcription error:", error);
      const message = error.message || 'Failed to process video for transcription.';
      setErrorMessages(prev => ({ ...prev, transcribe: message }));
      toast({ variant: 'destructive', title: 'Transcription Failed', description: message });
      setTranscription("Error during transcription.");
    } finally {
      setLoadingStates(prev => ({ ...prev, transcribe: false }));
    }
  };

  const runHighlightAnalysis = async () => {
    if (!transcription) return;
    setLoadingStates(prev => ({ ...prev, analysis: true }));
    setErrorMessages(prev => ({ ...prev, analysis: null }));
    setAnalyzedTranscriptionOutput(null); // Clear previous analysis

    try {
      toast({ title: 'Analyzing Transcription...', description: 'Identifying key insights for highlighting.' });
      const analysisResult: AnalyzeTranscriptionOutput = await handleAnalyzeTranscription({ transcription: transcription });
      setAnalyzedTranscriptionOutput(analysisResult);
      toast({ title: 'Analysis Complete', description: 'Transcription analyzed and highlights applied.' });
    } catch (analysisError: any) {
      console.error("Transcription analysis error:", analysisError);
      const message = analysisError.message || 'Failed to analyze transcription.';
      setErrorMessages(prev => ({ ...prev, analysis: message }));
      // Fallback to showing raw transcription if analysis fails
      setAnalyzedTranscriptionOutput({ segments: [{ text: transcription, highlight: false }] });
      toast({ variant: 'destructive', title: 'Analysis Failed', description: `${message} Displaying raw transcription.` });
    } finally {
      setLoadingStates(prev => ({ ...prev, analysis: false }));
    }
  };


  const generateSummary = async () => {
    if (!transcription) return;
    setLoadingStates(prev => ({ ...prev, summary: true }));
    setErrorMessages(prev => ({ ...prev, summary: null }));
    setSummary(null);
    try {
      const result: GenerateVideoSummaryOutput = await handleGenerateSummary({ transcript: transcription, customInstruction: summaryInstruction });
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
      const result: ExtractActionableItemsOutput = await handleExtractActionItems({ transcription: transcription, customInstruction: actionItemsInstruction });
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

  const currentTranscriptionText = analyzedTranscriptionOutput?.segments.map(s => s.text).join('') || transcription;

  return (
    <div className="flex flex-col items-center min-h-screen py-6 sm:py-10 px-4 bg-background text-foreground">
      <AppHeader />
      <main className="w-full max-w-3xl mt-8 space-y-6">
        <YoutubeUrlForm onSubmit={processVideo} isLoading={loadingStates.transcribe} initialUrl={youtubeUrl}/>

        {errorMessages.transcribe && (
          <Alert variant="destructive" className="shadow-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Transcription Error</AlertTitle>
            <AlertDescription>{errorMessages.transcribe}</AlertDescription>
          </Alert>
        )}

        {loadingStates.transcribe && <Card className="shadow-md"><CardContent className="p-6"><LoadingSpinner message="Transcribing video..." /></CardContent></Card>}

        {transcription && !loadingStates.transcribe && (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Video Transcription
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={runHighlightAnalysis} 
                    disabled={loadingStates.analysis || !transcription || transcription.startsWith("Error during")}
                    variant="outline"
                    size="sm"
                  >
                    {loadingStates.analysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze & Highlight
                  </Button>
                  <CopyToClipboardButton textToCopy={currentTranscriptionText} buttonText="Copy" size="sm" variant="ghost"/>
                </div>
              </div>
              {errorMessages.analysis && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Highlighting Error</AlertTitle>
                  <AlertDescription>{errorMessages.analysis}</AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60 w-full rounded-md border p-4 bg-muted/30">
                {loadingStates.analysis && !analyzedTranscriptionOutput ? (
                    <LoadingSpinner message="Analyzing for highlights..." />
                ) : (
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
                )}
              </ScrollArea>
              <p className="text-sm text-muted-foreground mt-3">
                Word count: {countWords(currentTranscriptionText)}
              </p>
            </CardContent>
             <CardFooter className="p-4 pt-0">
              <CardDescription>
                {analyzedTranscriptionOutput ? "Review the analyzed transcription. Highlighted sections indicate key parts identified by AI." : "Raw transcription is shown. Click 'Analyze & Highlight' for AI-powered insights."}
              </CardDescription>
            </CardFooter>
          </Card>
        )}

        {transcription && !loadingStates.transcribe && !transcription.startsWith("Error during") && (
          <>
            <Separator className="my-8" />
            <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Generate Insights</CardTitle>
                  <CardDescription>Use the transcription to generate summaries, action items, or a detailed plan. Add custom instructions for more tailored results.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Generation */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="summaryInstruction" className="flex items-center text-base font-medium">
                      <ScrollText className="mr-2 h-5 w-5 text-primary" />
                      Video Summary
                    </Label>
                    <Button onClick={generateSummary} disabled={loadingStates.summary || !transcription} size="sm">
                      {loadingStates.summary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Generate Summary
                    </Button>
                  </div>
                  <Textarea
                    id="summaryInstruction"
                    placeholder="Optional: Add custom instructions for summary (e.g., 'Focus on technical aspects', 'Keep it under 100 words')"
                    value={summaryInstruction}
                    onChange={(e) => setSummaryInstruction(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  {errorMessages.summary && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Summary Error</AlertTitle>
                      <AlertDescription>{errorMessages.summary}</AlertDescription>
                    </Alert>
                  )}
                  {loadingStates.summary && <div className="mt-2"><LoadingSpinner size="sm" message="Generating summary..." /></div>}
                  {summary && !loadingStates.summary && (
                    <Card className="mt-3 shadow-inner">
                      <CardHeader className="p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center">Summary Result</CardTitle>
                          <CopyToClipboardButton textToCopy={summary} buttonText="Copy" size="xs" variant="ghost" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <ScrollArea className="h-32 w-full rounded-md border p-3 bg-muted/20">
                          <p className="text-sm whitespace-pre-wrap break-words">{summary}</p>
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground mt-2">Word count: {countWords(summary)}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Separator />
                {/* Action Items Extraction */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                     <Label htmlFor="actionItemsInstruction" className="flex items-center text-base font-medium">
                        <ListChecks className="mr-2 h-5 w-5 text-primary" />
                        Actionable Items
                      </Label>
                    <Button onClick={extractActionItemsList} disabled={loadingStates.actionItems || !transcription} size="sm">
                      {loadingStates.actionItems ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Extract Action Items
                    </Button>
                  </div>
                  <Textarea
                    id="actionItemsInstruction"
                    placeholder="Optional: Add custom instructions for action items (e.g., 'Prioritize items for beginners', 'Categorize by effort')"
                    value={actionItemsInstruction}
                    onChange={(e) => setActionItemsInstruction(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  {errorMessages.actionItems && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Action Items Error</AlertTitle>
                      <AlertDescription>{errorMessages.actionItems}</AlertDescription>
                    </Alert>
                  )}
                  {loadingStates.actionItems && <div className="mt-2"><LoadingSpinner size="sm" message="Extracting action items..." /></div>}
                  {actionItems && !loadingStates.actionItems && (
                     <Card className="mt-3 shadow-inner">
                      <CardHeader className="p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center">Extracted Items</CardTitle>
                          <CopyToClipboardButton textToCopy={actionItems.join('\n')} buttonText="Copy" size="xs" variant="ghost" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <ScrollArea className="h-32 w-full rounded-md border p-3 bg-muted/20">
                          {actionItems.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
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
                </div>
                <Separator />
                {/* Actionable Plan Creation */}
                <div>
                  <div className="flex justify-between items-center">
                     <Label className="flex items-center text-base font-medium">
                        <ClipboardList className="mr-2 h-5 w-5 text-primary" />
                        Actionable Plan
                     </Label>
                    <Button onClick={createActionablePlan} disabled={loadingStates.actionablePlan || !transcription} size="sm">
                      {loadingStates.actionablePlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Create Actionable Plan
                    </Button>
                  </div>
                   {errorMessages.actionablePlan && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Actionable Plan Error</AlertTitle>
                      <AlertDescription>{errorMessages.actionablePlan}</AlertDescription>
                    </Alert>
                  )}
                  {loadingStates.actionablePlan && <div className="mt-2"><LoadingSpinner size="sm" message="Creating actionable plan..." /></div>}
                  {actionablePlan && !loadingStates.actionablePlan && (
                    <Card className="mt-3 shadow-inner">
                      <CardHeader className="p-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center">Generated Plan</CardTitle>
                          <CopyToClipboardButton textToCopy={actionablePlan} buttonText="Copy" size="xs" variant="ghost" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <ScrollArea className="h-48 w-full rounded-md border p-3 bg-muted/20">
                          <p className="text-sm whitespace-pre-wrap break-words">{actionablePlan}</p>
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground mt-2">Word count: {countWords(actionablePlan)}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Actionable Insights. All rights reserved.</p>
        <p>Powered by Genkit and Next.js.</p>
      </footer>
    </div>
  );
}
