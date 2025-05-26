
'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CopyToClipboardButtonProps {
  textToCopy: string | null | undefined;
  buttonText?: string;
  buttonTooltip?: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
}

export const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  textToCopy,
  buttonText, // If undefined, only icon will be shown for "icon" size
  buttonTooltip = "Copy to clipboard",
  className,
  disabled = false,
  variant = "outline",
  size = "sm",
}) => {
  const { toast } = useToast();

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevents triggering parent onClick events if nested
    if (!textToCopy) {
      toast({
        variant: 'destructive',
        title: 'Nothing to copy',
        description: 'The content is empty.',
        duration: 3000,
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: 'Copied to clipboard!',
        description: buttonText ? `${buttonText} copied.` : "Content copied.",
        duration: 3000,
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy text to clipboard.',
        duration: 3000,
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={!textToCopy || disabled}
      className={className}
      aria-label={buttonTooltip}
      title={buttonTooltip}
    >
      <Copy className={(buttonText && size !== 'icon') ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      {size !== 'icon' && buttonText}
    </Button>
  );
};
