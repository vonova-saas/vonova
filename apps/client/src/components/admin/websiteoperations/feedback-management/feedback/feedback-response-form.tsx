'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bug, Sparkles, Lightbulb, AlertTriangle, ArrowLeft, Loader2, Calendar, Smartphone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Feedback } from '../types';

const responseFormSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved', 'rejected']),
  response: z.string().min(1, { message: 'Response is required' }),
});

type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';

type ResponseFormValues = z.infer<typeof responseFormSchema>;

const typeIcons = {
  bug: <Bug className="h-4 w-4 text-red-500" />,
  feature: <Sparkles className="h-4 w-4 text-blue-500" />,
  suggestion: <Lightbulb className="h-4 w-4 text-yellow-500" />,
  other: <AlertTriangle className="h-4 w-4 text-purple-500" />,
};

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
];

interface FeedbackResponseFormProps {
  feedback: Feedback;
  onSubmit: (data: { status: FeedbackStatus; response: string }) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function FeedbackResponseForm({ feedback, onSubmit, onBack, isSubmitting = false }: FeedbackResponseFormProps) {
  const [isPreview, setIsPreview] = useState(false);
  
  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      status: feedback.status,
      response: feedback.response || '',
    },
  });

  const handleSubmit = async (data: ResponseFormValues) => {
    await onSubmit(data);
  };

  const status = form.watch('status');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {typeIcons[feedback.type as keyof typeof typeIcons] || typeIcons.other}
            <span className="capitalize">{feedback.type}</span>
          </Badge>
          <Badge variant="outline" className={statusOptions.find(s => s.value === status)?.color}>
            {statusOptions.find(s => s.value === status)?.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{feedback.contactEmail || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{feedback.metadata?.timestamp ? format(new Date(feedback.metadata.timestamp), 'MMM d, yyyy h:mm a') : 'N/A'}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm">
                {feedback.message}
              </div>
              {feedback.metadata.url && (
                <div className="mt-2">
                  <a 
                    href={feedback.metadata.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {feedback.metadata.url}
                  </a>
                </div>
              )}
              {feedback.metadata.userAgent && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">
                    {feedback.metadata.userAgent}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {feedback.response && (
          <div className="rounded-lg border border-blue-500/20 bg-blue-50/50 p-4 dark:bg-blue-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Your Response</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{feedback.respondedAt ? format(new Date(feedback.respondedAt), 'MMM d, yyyy h:mm a') : 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm">
              {feedback.response}
            </div>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="response"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Response</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreview(!isPreview)}
                    className="h-8 px-2 text-xs"
                  >
                    {isPreview ? 'Edit' : 'Preview'}
                  </Button>
                </div>
                {isPreview ? (
                  <div className="min-h-[80px] rounded-md border bg-muted/50 p-3 text-sm">
                    {field.value || <span className="text-muted-foreground">No response yet</span>}
                  </div>
                ) : (
                  <FormControl>
                    <Textarea
                      placeholder="Type your response here..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset({
                  status: feedback.status,
                  response: feedback.response || '',
                });
              }}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {feedback.response ? 'Update Response' : 'Send Response'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
