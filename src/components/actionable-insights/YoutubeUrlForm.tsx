'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Youtube, Loader2 } from 'lucide-react';

const formSchema = z.object({
  youtubeUrl: z.string().url({ message: "Please enter a valid YouTube URL." })
    .refine(val => val.includes("youtube.com/") || val.includes("youtu.be/"), {
      message: "URL must be a valid YouTube link."
    }),
});

type YoutubeUrlFormValues = z.infer<typeof formSchema>;

interface YoutubeUrlFormProps {
  onSubmit: (data: YoutubeUrlFormValues) => Promise<void>;
  isLoading: boolean;
  initialUrl?: string;
}

export function YoutubeUrlForm({ onSubmit, isLoading, initialUrl = '' }: YoutubeUrlFormProps) {
  const form = useForm<YoutubeUrlFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: initialUrl,
    },
  });

  useEffect(() => {
    form.setValue('youtubeUrl', initialUrl);
  }, [initialUrl, form]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Youtube className="mr-2 h-6 w-6 text-primary" />
          Process YouTube Video
        </CardTitle>
        <CardDescription>
          Enter a YouTube video URL to transcribe its content and generate insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="youtubeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="youtubeUrl">YouTube URL</FormLabel>
                  <FormControl>
                    <Input
                      id="youtubeUrl"
                      placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      {...field}
                      className="text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full text-base py-3">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Youtube className="mr-2 h-5 w-5" />
              )}
              {isLoading ? 'Processing...' : 'Process Video'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
