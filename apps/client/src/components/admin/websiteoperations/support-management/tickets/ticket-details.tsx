'use client';

import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Paperclip, 
  Send, 
  Loader2
} from 'lucide-react';
import { useState } from 'react';
import { SupportTicket } from '../types';

interface TicketDetailsProps {
  ticket: SupportTicket;
  onBack: () => void;
  onUpdateStatus: (status: SupportTicket['status']) => void;
  onSendResponse: (message: string) => void;
  isSubmitting: boolean;
}

export function TicketDetails({
  ticket,
  onBack,
  onUpdateStatus,
  onSendResponse,
  isSubmitting,
}: TicketDetailsProps) {
  const [response, setResponse] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isResponding, setIsResponding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;
    
    try {
      setIsResponding(true);
      await onSendResponse(response);
      setResponse('');
    } finally {
      setIsResponding(false);
    }
  };

  const statusVariant = {
    open: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  } as const;

  const priorityVariant = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to tickets
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <select
            value={ticket.status}
            onChange={(e) => onUpdateStatus(e.target.value as SupportTicket['status'])}
            className={`rounded-md px-3 py-1 text-sm font-medium ${
              statusVariant[ticket.status]
            } border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          {ticket.priority && (
            <Badge className={priorityVariant[ticket.priority]}>
              {ticket.priority} priority
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                <Badge variant="outline" className="capitalize">
                  {ticket.category.replace('-', ' ')}
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Created by {ticket.name} • {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`mailto:${ticket.email}`}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Send className="h-4 w-4" />
                {ticket.email}
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="whitespace-pre-line">{ticket.message}</p>
          </div>

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((file, i) => (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-muted/50"
                  >
                    <Paperclip className="h-4 w-4" />
                    {file.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Conversation</h3>
        
        <div className="space-y-6">
          {ticket.responses?.map((response) => (
            <div key={response.id} className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${response.userName}`} />
                <AvatarFallback>{response.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {response.userName}
                    {response.userRole === 'admin' && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="mt-1 text-sm whitespace-pre-line">{response.message}</div>
                
                {response.attachments && response.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {response.attachments.map((file, i) => (
                      <a
                        key={i}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Paperclip className="h-3 w-3" />
                        {file.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
          <Textarea
            placeholder="Type your response..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
              </Button>
            </div>
            <Button type="submit" disabled={!response.trim() || isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send response
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
