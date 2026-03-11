"use client";

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/global/icons';
import { addSupportTicketMutationFn } from '@/services/app/support/support.api';
import { toast } from "sonner";
import { useAuthContext } from '@/context/app/auth/auth-context';

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
  const pathname = usePathname();
  const { user } = useAuthContext();
  const userId = useMemo(() => {
    // Always use the authenticated user's ID if available
    if (user?._id) return user._id;
    return '';
  }, [user?._id]);
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: ''
  });

  const userEmail = user?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!userId) {
        toast.error('Missing user id in URL');
        return;
      }
      const res = await addSupportTicketMutationFn(userId, {
        fullName: formData.name,
        email: userEmail,
        category: formData.category,
        subject: formData.subject,
        message: formData.message,
      });
      toast.success(res.message);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('support:updated'));
      }
      // Reset form
      setFormData({ name: '', email: '', category: 'general', subject: '', message: '' });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error)?.message || 'Failed to send support request';
      toast.error(message);
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
                value={userEmail}
                readOnly
                disabled
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
              <SelectTrigger id="category">
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
