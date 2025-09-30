"use client";

import { Icons } from "@/components/global/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { deleteFeedbackMutationFn, getFeedbackByIdMutationFn, getFeedbackMutationFn, updateFeedbackMutationFn, addFeedbackMessageMutationFn, getFeedbackMessagesQueryFn, updateFeedbackStatusMutationFn } from "@/services/app/feedback/feedback.api";
import { updateFeedbackType, FeedbackMessage, FeedbackStatus } from "@/types/api/app/feedback/feedback.type";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface EditData {
  feedbackType: updateFeedbackType['feedbackType'];
  message: string;
}

export default function FeedbackEditPage() {
  const params = useParams<{ portfolioId: string; feedbackId: string }>();
  const router = useRouter();
  const { user } = useAuthContext();

  const userId = useMemo(() => user?._id || params?.portfolioId || "", [user?._id, params?.portfolioId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullId, setFullId] = useState<string>("");
  const [form, setForm] = useState<EditData>({ feedbackType: 'suggestion', message: '' });
  const [status, setStatus] = useState<FeedbackStatus>('open');
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const shortParam = (params?.feedbackId as string) || ""; // e.g. feedback-68d479
  const prefix = shortParam.replace(/^feedback-/, "");

  useEffect(() => {
    (async () => {
      try {
        if (!userId || !prefix) return;
        // We only have short id, so list and match prefix
        const list = await getFeedbackMutationFn(userId);
        const match = list.data.find(f => f._id?.startsWith(prefix));
        if (!match) {
          toast.error("Feedback not found");
          router.back();
          return;
        }
        setFullId(match._id);
        const detail = await getFeedbackByIdMutationFn(userId, match._id);
        const type = (detail.data.feedbackType as EditData['feedbackType']) || 'suggestion';
        const message = detail.data.userBugReport || detail.data.userFeatureRequest || detail.data.userSuggestion || detail.data.userOther || '';
        setForm({ feedbackType: type, message });
        setStatus(detail.data.status as FeedbackStatus);
        // Load messages
        try {
          if (Array.isArray(detail.data.messages)) {
            setMessages(detail.data.messages as FeedbackMessage[]);
          } else {
            const msgRes = await getFeedbackMessagesQueryFn(userId, match._id);
            setMessages(msgRes.data);
          }
        } catch {
          // ignore if messages endpoint not available yet
        }
      } catch (e) {
        toast.error((e as Error)?.message || 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, prefix]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !fullId) return;
    setSaving(true);
    try {
      const payload: updateFeedbackType = { feedbackType: form.feedbackType };
      if (form.feedbackType === 'bug-report') payload.userBugReport = form.message;
      else if (form.feedbackType === 'feature-request') payload.userFeatureRequest = form.message;
      else if (form.feedbackType === 'suggestion') payload.userSuggestion = form.message;
      else payload.userOther = form.message;
      const res = await updateFeedbackMutationFn(userId, fullId, payload);
      toast.success(res.message);
      router.push(`/${userId}/feedback`);
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to update feedback');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!userId || !fullId) return;
    try {
      const res = await deleteFeedbackMutationFn(userId, fullId);
      toast.success(res.message);
      router.push(`/${userId}/feedback`);
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to delete feedback');
    }
  };

  const sendMessage = async () => {
    if (!userId || !fullId) return;
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await addFeedbackMessageMutationFn(userId, fullId, { message: newMessage.trim() });
      setMessages(res.data);
      setNewMessage('');
      toast.success('Message sent');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('feedback:updated'));
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const onUpdateStatus = async (next: FeedbackStatus) => {
    if (!userId || !fullId) return;
    setStatusSaving(true);
    try {
      const res = await updateFeedbackStatusMutationFn(userId, fullId, { status: next });
      setStatus(res.data.status as FeedbackStatus);
      toast.success('Status updated');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('feedback:updated'));
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to update status');
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Feedback</CardTitle>
            <CardDescription>Update your previous feedback submission.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icons.spinner className="h-4 w-4 animate-spin" /> Loading
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-8">
                <div>
                  <Label className="text-base font-medium">Feedback type</Label>
                  <RadioGroup
                    className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4"
                    value={form.feedbackType}
                    onValueChange={(v: EditData['feedbackType']) => setForm(prev => ({ ...prev, feedbackType: v }))}
                  >
                    <div>
                      <RadioGroupItem value="bug-report" id="bug-report" className="peer sr-only" />
                      <Label htmlFor="bug-report" className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 cursor-pointer ${form.feedbackType === 'bug-report' ? 'border-primary bg-accent' : ''}`}>Bug Report</Label>
                    </div>
                    <div>
                      <RadioGroupItem value="feature-request" id="feature-request" className="peer sr-only" />
                      <Label htmlFor="feature-request" className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 cursor-pointer ${form.feedbackType === 'feature-request' ? 'border-primary bg-accent' : ''}`}>Feature Request</Label>
                    </div>
                    <div>
                      <RadioGroupItem value="suggestion" id="suggestion" className="peer sr-only" />
                      <Label htmlFor="suggestion" className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 cursor-pointer ${form.feedbackType === 'suggestion' ? 'border-primary bg-accent' : ''}`}>Suggestion</Label>
                    </div>
                    <div>
                      <RadioGroupItem value="other" id="other" className="peer sr-only" />
                      <Label htmlFor="other" className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 cursor-pointer ${form.feedbackType === 'other' ? 'border-primary bg-accent' : ''}`}>Other</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msg">Message</Label>
                  <Textarea id="msg" value={form.message} onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))} rows={6} required />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={saving} className="cursor-pointer">
                    {saving ? <Icons.spinner className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save changes
                  </Button>
                  <Button type="button" variant="destructive" onClick={onDelete} className="cursor-pointer">Delete</Button>
                  <Button type="button" variant="outline" onClick={() => router.back()} className="cursor-pointer">Cancel</Button>
                </div>

                {/* Conversation thread */}
                <div className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Conversation</h3>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Status</Label>
                      <select
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        value={status}
                        onChange={(e) => onUpdateStatus(e.target.value as FeedbackStatus)}
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      {statusSaving ? <Icons.spinner className="h-4 w-4 animate-spin" /> : null}
                    </div>
                  </div>

                  <div className="rounded-md border bg-muted/40 p-4 max-h-[360px] overflow-auto space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                    ) : (
                      messages.map((m, idx) => (
                        <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow ${m.sender === 'user' ? 'bg-primary/90 text-primary-foreground' : 'bg-white border'}`}>
                            <div className="opacity-80 text-xs mb-1">{m.sender === 'user' ? 'You' : 'Support'}</div>
                            <div>{m.message}</div>
                            <div className="mt-1 text-xs opacity-90">{new Date(m.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <Button type="button" onClick={sendMessage} disabled={sending || !newMessage.trim()} className="self-stretch">
                      {sending ? <Icons.spinner className="h-4 w-4 animate-spin mr-2" /> : <Icons.Send className="h-4 w-4 mr-2" />}
                      Send
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
