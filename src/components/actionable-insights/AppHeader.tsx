
'use client';

import { BrainCircuit, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  onSettingsClick: () => void;
}

export function AppHeader({ onSettingsClick }: AppHeaderProps) {
  return (
    <header className="flex flex-col items-center text-center w-full">
      <div className="flex items-center justify-center space-x-3 mb-2 w-full relative">
        <div className="flex items-center justify-center flex-grow">
          <BrainCircuit className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary ml-3">
            YT Video to Action
          </h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onSettingsClick} 
          className="absolute right-0 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>
      <p className="text-md sm:text-lg text-muted-foreground max-w-xl">
        Unlock the potential of video content. Transcribe, summarize, and plan with AI.
      </p>
    </header>
  );
}
