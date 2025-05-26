'use client';

import { BrainCircuit } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="flex flex-col items-center text-center">
      <div className="flex items-center justify-center space-x-3 mb-2">
        <BrainCircuit className="h-12 w-12 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Actionable Insights
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Unlock the potential of video content. Transcribe, summarize, and plan with AI.
      </p>
    </header>
  );
}
