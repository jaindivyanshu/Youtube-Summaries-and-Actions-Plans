
'use client';

import { useState, useRef, useEffect } from 'react';
import { AppHeader } from '@/components/actionable-insights/AppHeader';
import { YoutubeUrlForm } from '@/components/actionable-insights/YoutubeUrlForm';
import { LoadingSpinner } from '@/components/actionable-insights/LoadingSpinner';
import { CopyToClipboardButton } from '@/components/actionable-insights/CopyToClipboardButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  handleTranscribeVideo,
  handleGenerateSummary,
  handleExtractActionItems,
  handleCreateActionablePlan,
  handleAnalyzeTranscription,
  handleTranscribeUploadedAudio,
} from './actions';
import type { TranscribeYouTubeVideoOutput } from '@/ai/flows/transcribe-youtube-video';
import type { GenerateVideoSummaryOutput } from '@/ai/flows/generate-video-summary';
import type { ExtractActionableItemsOutput } from '@/ai/flows/extract-actionable-items';
import type { ConvertToPlanOutput } from '@/ai/flows/convert-to-actionable-plan';
import type { AnalyzeTranscriptionOutput } from '@/ai/flows/analyze-transcription-flow';
import type { TranscribeUploadedAudioOutput } from '@/ai/flows/transcribe-uploaded-audio-flow';

import { ClipboardList, FileText, ListChecks, Loader2, ScrollText, AlertCircle, Sparkles, UploadCloud, FileAudio, Save } from 'lucide-react';

type YoutubeUrlFormValues = { youtubeUrl: string };

interface LoadingStates {
  transcribeVideo: boolean;
  transcribeAudio: boolean;
  analysis: boolean;
  summary: boolean;
  actionItems: boolean;
  actionablePlan: boolean;
}

interface ErrorMessages {
  transcribeVideo: string | null;
  transcribeAudio: string | null;
  analysis: string | null;
  summary: string | null;
  actionItems: string | null;
  actionablePlan: string | null;
}

const NO_TRANSCRIPT_PATTERNS = [
  /Transcription not available for video id:/i,
  /Automated transcription for video ID \w+ is not yet implemented/i,
  /AI speech-to-text transcription failed/i,
  /Audio for video \w+ could not be downloaded/i,
  /No pre-existing transcript found/i, 
  /Error: No pre-existing transcript found/i, 
  /^Error:/i, 
  /^$/, 
];

const GOOGLE_API_KEY_STORAGE_KEY = 'actionableInsights_googleApiKey';

export default function ActionableInsightsPage() {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [transcription, setTranscription] = useState<string | null>(null);
  const [analyzedTranscriptionOutput, setAnalyzedTranscriptionOutput] = useState<AnalyzeTranscriptionOutput | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [actionItems, setActionItems] = useState<string[] | null>(null);
  const [actionablePlan, setActionablePlan] = useState<string | null>(null);

  const [summaryInstruction, setSummaryInstruction] = useState<string>('');
  const [actionItemsInstruction, setActionItemsInstruction] = useState<string>('');

  const [showAudioUpload, setShowAudioUpload] = useState<boolean>(false);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [googleApiKeyInput, setGoogleApiKeyInput] = useState('');

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    transcribeVideo: false,
    transcribeAudio: false,
    analysis: false,
    summary: false,
    actionItems: false,
    actionablePlan: false,
  });

  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({
    transcribeVideo: null,
    transcribeAudio: null,
    analysis: null,
    summary: null,
    actionItems: null,
    actionablePlan: null,
  });

  const { toast } = useToast();

  useEffect(() => {
    // Load API key from localStorage on mount
    const storedApiKey = localStorage.getItem(GOOGLE_API_KEY_STORAGE_KEY);
    if (storedApiKey) {
      setGoogleApiKeyInput(storedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem(GOOGLE_API_KEY_STORAGE_KEY, googleApiKeyInput);
    toast({ title: 'API Key Saved', description: 'Your Google AI API Key has been saved in browser storage.' });
    setIsSettingsDialogOpen(false);
  };
  
  const handleClearApiKey = () => {
    localStorage.removeItem(GOOGLE_API_KEY_STORAGE_KEY);
    setGoogleApiKeyInput('');
    toast({ title: 'API Key Cleared', description: 'Your Google AI API Key has been cleared from browser storage.' });
  };

  const countWords = (text: string | null): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const resetResults = (fullReset: boolean = true) => {
    if (fullReset) {
      setTranscription(null);
      setYoutubeUrl('');
      if (audioInputRef.current) {
        audioInputRef.current.value = ''; 
      }
    }
    setAnalyzedTranscriptionOutput(null);
    setSummary(null);
    setActionItems(null);
    setActionablePlan(null);
    setSummaryInstruction('');
    setActionItemsInstruction('');
    setShowAudioUpload(false);
    setUploadedAudioFile(null);
    setErrorMessages({ 
      transcribeVideo: null, transcribeAudio: null, analysis: null, 
      summary: null, actionItems: null, actionablePlan: null 
    });
  };

  const processVideo = async (data: YoutubeUrlFormValues) => {
    resetResults();
    setYoutubeUrl(data.youtubeUrl);
    setLoadingStates(prev => ({ ...prev, transcribeVideo: true }));
    setErrorMessages(prev => ({ ...prev, transcribeVideo: null, transcribeAudio: null, analysis: null }));

    try {
      const transcribeResult: TranscribeYouTubeVideoOutput = await handleTranscribeVideo({ youtubeUrl: data.youtubeUrl });
      const isNoTranscript = !transcribeResult.transcription || NO_TRANSCRIPT_PATTERNS.some(pattern => pattern.test(transcribeResult.transcription || ''));

      if (isNoTranscript) {
        setTranscription(null); 
        setShowAudioUpload(true);
        setErrorMessages(prev => ({ ...prev, transcribeVideo: transcribeResult.transcription || "No transcript found or error during processing. Try uploading an audio file." }));
        toast({
          title: "No Automated Transcript",
          description: "Could not fetch or generate a transcript from the YouTube URL. You can try uploading an audio file directly.",
          variant: "default",
          duration: 7000,
        });
      } else {
        setTranscription(transcribeResult.transcription);
        setShowAudioUpload(false);
        toast({ title: 'Transcription Successful', description: 'Transcription ready from YouTube URL.' });
      }

    } catch (error: any) { 
      console.error("processVideo (URL) error:", error);
      const message = error.message || 'Failed to process video for transcription.';
      setErrorMessages(prev => ({ ...prev, transcribeVideo: message }));
      toast({ variant: 'destructive', title: 'Video Processing Failed', description: message });
      setTranscription(null); 
      setShowAudioUpload(true); 
    } finally {
      setLoadingStates(prev => ({ ...prev, transcribeVideo: false }));
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedAudioFile(file);
      setErrorMessages(prev => ({ ...prev, transcribeAudio: null }));
    } else {
      setUploadedAudioFile(null);
    }
  };

  const transcribeUploadedFile = async () => {
    if (!uploadedAudioFile) {
      setErrorMessages(prev => ({...prev, transcribeAudio: "Please select an audio file first."}));
      return;
    }
    setLoadingStates(prev => ({ ...prev, transcribeAudio: true }));
    setErrorMessages(prev => ({ ...prev, transcribeAudio: null }));
    setTranscription(null); 
    setAnalyzedTranscriptionOutput(null); 

    const reader = new FileReader();
    reader.readAsDataURL(uploadedAudioFile);
    reader.onloadend = async () => {
      try {
        const audioDataUri = reader.result as string;
        if (!audioDataUri) {
          throw new Error("Could not read audio file.");
        }
        toast({ title: 'Transcribing Audio...', description: 'Processing your uploaded audio file.' });
        const result: TranscribeUploadedAudioOutput = await handleTranscribeUploadedAudio({ audioDataUri });
        setTranscription(result.transcription);
        setShowAudioUpload(false); 
        setUploadedAudioFile(null); 
        if (audioInputRef.current) audioInputRef.current.value = ''; 
        toast({ title: 'Audio Transcription Successful', description: 'Transcription from uploaded file is ready.' });
      } catch (error: any) {
        console.error("Uploaded audio transcription error:", error);
        const message = error.message || 'Failed to transcribe uploaded audio.';
        setErrorMessages(prev => ({ ...prev, transcribeAudio: message }));
        toast({ variant: 'destructive', title: 'Audio Transcription Failed', description: message });
        setTranscription(null); 
      } finally {
        setLoadingStates(prev => ({ ...prev, transcribeAudio: false }));
      }
    };
    reader.onerror = () => {
      console.error("File reading error");
      setErrorMessages(prev => ({...prev, transcribeAudio: "Error reading the audio file."}));
      toast({ variant: 'destructive', title: 'File Read Error', description: "Could not read the selected audio file." });
      setLoadingStates(prev => ({ ...prev, transcribeAudio: false }));
    };
  };

  const runHighlightAnalysis = async () => {
    if (!transcription) return;
    setLoadingStates(prev => ({ ...prev, analysis: true }));
    setErrorMessages(prev => ({ ...prev, analysis: null }));
    setAnalyzedTranscriptionOutput(null); 

    try {
      toast({ title: 'Analyzing Transcription...', description: 'Identifying key insights for highlighting.' });
      const analysisResult: AnalyzeTranscriptionOutput = await handleAnalyzeTranscription({ transcription: transcription });
      setAnalyzedTranscriptionOutput(analysisResult);
      toast({ title: 'Analysis Complete', description: 'Transcription analyzed and highlights applied.' });
    } catch (analysisError: any) {
      console.error("Transcription analysis error:", analysisError);
      const message = analysisError.message || 'Failed to analyze transcription.';
      setErrorMessages(prev => ({ ...prev, analysis: message }));
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
  const canShowInsights = transcription && !transcription.startsWith("Error during") && !loadingStates.transcribeVideo && !loadingStates.transcribeAudio;

  return (
    <div className="flex flex-col items-center min-h-screen py-6 sm:py-10 px-4 bg-background text-foreground">
      <AppHeader onSettingsClick={() => setIsSettingsDialogOpen(true)} />

      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Settings</DialogTitle>
            <DialogDescription>
              Manage your Google AI API Key. This key is stored locally in your browser.
              <br />
              <span className="text-xs text-destructive/80">
                Note: For production, API keys should be managed server-side.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="googleApiKey">Google AI API Key</Label>
              <Input
                id="googleApiKey"
                type="password"
                placeholder="Enter your API key"
                value={googleApiKeyInput}
                onChange={(e) => setGoogleApiKeyInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
             <Button type="button" variant="outline" onClick={handleClearApiKey}>
                Clear Key
              </Button>
            <div className="flex gap-2">
             <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleSaveApiKey}>
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="w-full max-w-3xl mt-8 space-y-6">
        <YoutubeUrlForm onSubmit={processVideo} isLoading={loadingStates.transcribeVideo} initialUrl={youtubeUrl}/>

        {errorMessages.transcribeVideo && !transcription && (
          <Alert variant="destructive" className="shadow-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Video Processing Error</AlertTitle>
            <AlertDescription>{errorMessages.transcribeVideo}</AlertDescription>
          </Alert>
        )}
        
        {loadingStates.transcribeVideo && <Card className="shadow-md"><CardContent className="p-6"><LoadingSpinner message="Processing YouTube URL..." /></CardContent></Card>}

        {showAudioUpload && !transcription && !loadingStates.transcribeVideo && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UploadCloud className="mr-2 h-6 w-6 text-primary" />
                Upload Audio File
              </CardTitle>
              <CardDescription>
                No transcript could be retrieved from the YouTube URL. Please upload an audio file (e.g., MP3, WAV, M4A) to generate a transcription.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                type="file" 
                accept="audio/*" 
                onChange={handleFileChange} 
                ref={audioInputRef}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {uploadedAudioFile && <p className="text-sm text-muted-foreground">Selected file: {uploadedAudioFile.name}</p>}
              <Button 
                onClick={transcribeUploadedFile} 
                disabled={!uploadedAudioFile || loadingStates.transcribeAudio}
                className="w-full"
              >
                {loadingStates.transcribeAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileAudio className="mr-2 h-4 w-4" />}
                Transcribe Uploaded Audio
              </Button>
              {errorMessages.transcribeAudio && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Audio Transcription Error</AlertTitle>
                  <AlertDescription>{errorMessages.transcribeAudio}</AlertDescription>
                </Alert>
              )}
              {loadingStates.transcribeAudio && <LoadingSpinner message="Transcribing audio file..." />}
            </CardContent>
          </Card>
        )}

        {transcription && !loadingStates.transcribeVideo && !loadingStates.transcribeAudio && (
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
              <ScrollArea className="h-96 w-full rounded-md border p-4 bg-muted/30">
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

        {canShowInsights && (
          <>
            <Separator className="my-8" />
            <Card className="shadow-lg">
              <CardHeader>
                  <CardTitle>Generate Insights</CardTitle>
                  <CardDescription>Use the transcription to generate summaries, action items, or a detailed plan. Add custom instructions for more tailored results.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        <ScrollArea className="h-60 w-full rounded-md border p-3 bg-muted/20">
                          <p className="text-sm whitespace-pre-wrap break-words">{summary}</p>
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground mt-2">Word count: {countWords(summary)}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Separator />
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
                        <ScrollArea className="h-60 w-full rounded-md border p-3 bg-muted/20">
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
                        <ScrollArea className="h-80 w-full rounded-md border p-3 bg-muted/20">
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
        <p>&copy; {new Date().getFullYear()} YT Video to Action. All rights reserved.</p>
        <p>Powered by Genkit and Next.js.</p>
      </footer>
    </div>
  );
}
