'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icons from '@/components/global/icons';

type SupportCategory = 'technical' | 'billing' | 'general' | 'feature-request' | 'bug-report';

interface SupportFormData {
  name: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
}

export function SupportForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement form submission logic
      console.log('Form submitted:', formData);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // TODO: Show success message
    } catch (error) {
      console.error('Error submitting form:', error);
      // TODO: Show error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Contact Support</CardTitle>
        <CardDescription>
          Fill out the form below and our team will get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.category}
              onValueChange={(value: SupportCategory) =>
                setFormData(prev => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Support</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="feature-request">Feature Request</SelectItem>
                <SelectItem value="bug-report">Report a Bug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject <span className="text-destructive">*</span>
            </label>
            <Input
              id="subject"
              name="subject"
              placeholder="Briefly describe your issue"
              required
              value={formData.subject}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Please provide as much detail as possible..."
              rows={6}
              required
              value={formData.message}
              onChange={handleChange}
              className="min-h-[150px]"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.Send className="mr-2 h-4 w-4" />
              )}
              Send Message
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
