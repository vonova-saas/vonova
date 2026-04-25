"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/global/icons";
import { avatarImgSrcForDisplay } from "@/lib/avatar-display-url";
import { getAvatarFallbackText } from "@/utils/functions/app/helper";
import { toast } from "sonner";
import { getSupportTicketByIdMutationFn, getSupportTicketMutationFn, updateSupportTicketMutationFn, deleteSupportTicketMutationFn, getSupportMessagesQueryFn, addSupportMessageMutationFn, updateSupportStatusMutationFn } from "@/services/app/support/support.api";
import type { SupportCategory, SupportMessage, SupportStatus, updateSupportTicketType } from "@/types/api/app/support/support.type";

interface EditSupportData {
  fullName: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
}

export default function SupportEditPage() {
  const params = useParams<{ portfolioId: string; supportId: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = useMemo(() => user?._id || params?.portfolioId || "", [user?._id, params?.portfolioId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullId, setFullId] = useState<string>("");
  const [form, setForm] = useState<EditSupportData>({ fullName: "", email: "", category: "general", subject: "", message: "" });
  const [status, setStatus] = useState<SupportStatus>("open");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const shortParam = (params?.supportId as string) || ""; // e.g. support-68d479
  const prefix = shortParam.replace(/^support-/, "");
  const userEmail = user?.email || '';

  useEffect(() => {
    (async () => {
      try {
        if (!userId || !prefix) return;
        const list = await getSupportTicketMutationFn(userId);
        const match = list.data.find(f => f._id?.startsWith(prefix));
        if (!match) {
          toast.error("Support ticket not found");
          router.back();
          return;
        }
        setFullId(match._id);
        const detail = await getSupportTicketByIdMutationFn(userId, match._id);
        setForm({
          fullName: detail.data.fullName || "",
          email: userEmail || "",
          category: detail.data.category,
          subject: detail.data.subject || "",
          message: detail.data.message || "",
        });
        setStatus(detail.data.status as SupportStatus);
        // Always load thread from messages endpoint so admin replies (`sender: admin`) are never skipped
        // when `findOne` embeds an empty `messages: []` array.
        try {
          const msgRes = await getSupportMessagesQueryFn(userId, match._id);
          const fromApi = Array.isArray(msgRes.data) ? msgRes.data : [];
          setMessages(fromApi as SupportMessage[]);
        } catch {
          const embedded = (detail.data as { messages?: SupportMessage[] }).messages;
          if (Array.isArray(embedded) && embedded.length > 0) {
            setMessages(embedded);
          }
        }
      } catch (e) {
        toast.error((e as Error)?.message || "Failed to load support ticket");
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
      const payload: updateSupportTicketType = {
        fullName: form.fullName,
        email: userEmail,
        category: form.category,
        subject: form.subject,
        message: form.message,
      };
      const res = await updateSupportTicketMutationFn(userId, fullId, payload);
      toast.success(res.message);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('support:updated'));
      }
      router.push(`/${userId}/support`);
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!userId || !fullId) return;
    try {
      const res = await deleteSupportTicketMutationFn(userId, fullId);
      toast.success(res.message);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('support:updated'));
      }
      router.push(`/${userId}/support`);
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to delete ticket');
    }
  };

  const sendMessage = async () => {
    if (!userId || !fullId) return;
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await addSupportMessageMutationFn(userId, fullId, { message: newMessage.trim() });
      setMessages(res.data);
      setNewMessage("");
      toast.success("Message sent");
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('support:updated'));
      }
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const onUpdateStatus = async (next: SupportStatus) => {
    if (!userId || !fullId) return;
    setStatusSaving(true);
    try {
      const res = await updateSupportStatusMutationFn(userId, fullId, { status: next });
      setStatus(res.data.status as SupportStatus);
      toast.success("Status updated");
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('support:updated'));
      }
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
            <CardTitle>Edit Support Ticket</CardTitle>
            <CardDescription>Update your request or message to Support.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icons.spinner className="h-4 w-4 animate-spin" /> Loading
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={form.fullName}
                      onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      readOnly
                      disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={form.category} onValueChange={(v: SupportCategory) => setForm(prev => ({ ...prev, category: v }))}>
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
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={form.subject} onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" value={form.message} onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))} rows={6} required />
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
                      <Select value={status} onValueChange={(v: SupportStatus) => onUpdateStatus(v)}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      {statusSaving ? <Icons.spinner className="h-4 w-4 animate-spin" /> : null}
                    </div>
                  </div>

                  <div className="rounded-md border bg-muted/40 p-4 max-h-[360px] overflow-auto space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                    ) : (
                      messages.map((m, idx) => {
                        const fromUser = m.sender === "user";
                        const supportLabel = m.senderName?.trim() || "Support";
                        const avatarSrc =
                          !fromUser && m.senderAvatarUrl
                            ? avatarImgSrcForDisplay(m.senderAvatarUrl)
                            : null;
                        return (
                        <div key={`${m.createdAt}-${idx}`} className={`flex gap-2 ${fromUser ? 'justify-end' : 'justify-start'}`}>
                          {!fromUser && (
                            <Avatar className="h-8 w-8 mt-1 shrink-0">
                              {avatarSrc ? (
                                <AvatarImage src={avatarSrc} alt="" referrerPolicy="no-referrer" />
                              ) : null}
                              <AvatarFallback className="text-xs">{getAvatarFallbackText(supportLabel)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow ${fromUser ? 'bg-primary/90 text-primary-foreground' : 'bg-white border'}`}>
                            <div className="opacity-80 text-xs mb-1">{fromUser ? 'You' : supportLabel}</div>
                            <div>{m.message}</div>
                            <div className="mt-1 text-xs opacity-90">{new Date(m.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        );
                      })
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
