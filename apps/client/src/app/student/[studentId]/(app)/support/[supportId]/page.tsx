"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/context/app/auth/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/global/icons";
import { toast } from "sonner";
import { getSupportTicketByIdMutationFn, getSupportTicketMutationFn, updateSupportTicketMutationFn, deleteSupportTicketMutationFn } from "@/services/app/support/support.api";
import type { SupportCategory, updateSupportTicketType } from "@/types/api/app/support/support.type";

interface EditSupportData {
  fullName: string;
  email: string;
  category: SupportCategory;
  subject: string;
  message: string;
}

export default function SupportEditPage() {
  const params = useParams<{ studentId: string; supportId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = useMemo(() => user?._id || params?.studentId || "", [user?._id, params?.studentId]);
  const supportBasePath = useMemo(() => {
    const path = pathname || "";
    const idx = path.lastIndexOf("/support-");
    if (idx > 0) return path.slice(0, idx);
    return userId ? `/${userId}/support` : "/support";
  }, [pathname, userId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullId, setFullId] = useState<string>("");
  const [form, setForm] = useState<EditSupportData>({ fullName: "", email: "", category: "general", subject: "", message: "" });

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
      router.push(supportBasePath);
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
      router.push(supportBasePath);
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to delete ticket');
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

              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
