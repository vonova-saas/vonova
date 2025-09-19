'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/global/icons';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface FeedbackFormData {
  feedbackType: 'bug' | 'feature' | 'suggestion' | 'other';
  message: string;
  contactEmail: string;
}

export function FeedbackForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    feedbackType: 'suggestion',
    message: '',
    contactEmail: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement form submission logic
      console.log('Feedback submitted:', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // TODO: Show error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-2xl mx-auto text-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Icons.Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-semibold">Thank You!</h3>
          <p className="text-muted-foreground">
            Your feedback has been received. We appreciate you taking the time to help us improve.
          </p>
          <Button
            className="mt-4"
            onClick={() => setSubmitted(false)}
          >
            Submit Another Feedback
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Share Your Feedback</CardTitle>
        <CardDescription>
          We&apos;d love to hear your thoughts, suggestions, or report any issues you&apos;re experiencing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">What type of feedback do you have?</Label>
              <RadioGroup
                defaultValue="suggestion"
                className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4"
                onValueChange={(value: FeedbackFormData['feedbackType']) =>
                  setFormData(prev => ({ ...prev, feedbackType: value }))
                }
                value={formData.feedbackType}
              >
                <div>
                  <RadioGroupItem value="bug" id="bug" className="peer sr-only" />
                  <Label
                    htmlFor="bug"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${formData.feedbackType === 'bug' ? 'border-primary bg-accent' : ''
                      }`}
                  >
                    <Icons.bug className="mb-2 h-6 w-6 text-red-500" />
                    Bug Report
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="feature" id="feature" className="peer sr-only" />
                  <Label
                    htmlFor="feature"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${formData.feedbackType === 'feature' ? 'border-primary bg-accent' : ''
                      }`}
                  >
                    <Icons.sparkles className="mb-2 h-6 w-6 text-blue-500" />
                    Feature Request
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="suggestion" id="suggestion" className="peer sr-only" />
                  <Label
                    htmlFor="suggestion"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${formData.feedbackType === 'suggestion' ? 'border-primary bg-accent' : ''
                      }`}
                  >
                    <Icons.lightbulb className="mb-2 h-6 w-6 text-yellow-500" />
                    Suggestion
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="other" id="other" className="peer sr-only" />
                  <Label
                    htmlFor="other"
                    className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer ${formData.feedbackType === 'other' ? 'border-primary bg-accent' : ''
                      }`}
                  >
                    <Icons.message className="mb-2 h-6 w-6 text-purple-500" />
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Your {formData.feedbackType === 'bug' ? 'Bug Report' : formData.feedbackType === 'feature' ? 'Feature Request' : formData.feedbackType === 'suggestion' ? 'Suggestion' : 'Other'}
                <span className="text-destructive"> *</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                placeholder={
                  formData.feedbackType === 'bug'
                    ? 'Please describe the bug you encountered, including steps to reproduce...'
                    : formData.feedbackType === 'feature'
                      ? 'Tell us about the feature you\'d like to see...'
                      : formData.feedbackType === 'suggestion'
                        ? 'tell us about your suggestion ✨...'
                        : 'Share your thoughts with us...'
                }
                rows={6}
                required
                value={formData.message}
                onChange={handleChange}
                className="min-h-[150px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">
                Email (optional)
              </Label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="email@example.com"
                value={formData.contactEmail}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-sm text-muted-foreground">
                Only if you&apos;d like us to follow up with you.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.Send className="mr-2 h-4 w-4" />
              )}
              Submit Feedback
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
