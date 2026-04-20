"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CheckCircle, Component as ComponentIcon, BookOpen } from "lucide-react";
import { useQuizStore } from "@/lib/stores";
import type { Question } from "@/types/api/student/lms/quizzes/quiz.type";
import { useAuthContext } from "@/context/app/auth/auth-context";

export default function EditQuizPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useAuthContext();
  const instructorId = user?._id;
  const { fetchById, updateQuiz } = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [noOfQuestions, setNoOfQuestions] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  // ============== (draft) ============== 
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = `lms_quiz_draft_${id}`;
  // ============== (draft) ============== 

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const quiz = await fetchById(id);
        if (!mounted) return;
        if (quiz) {
          setTitle(quiz.title || "");
          setDescription(quiz.description || "");
          setTopic(quiz.topic || "");
          setNoOfQuestions(typeof quiz.noOfQuestions === "string" ? quiz.noOfQuestions : String(quiz.noOfQuestions ?? ""));
          setQuestions(quiz.questions || []);

          // Offer restoring draft if exists ============== (draft) ==============
          try {
            const draft = localStorage.getItem(draftKey);
            if (draft) {
              const parsed = JSON.parse(draft) as {
                title: string; description: string; topic: string; noOfQuestions: string; questions: Question[];
              };
              const isDifferent = (
                parsed.title !== (quiz.title || "") ||
                parsed.description !== (quiz.description || "") ||
                parsed.topic !== (quiz.topic || "") ||
                parsed.noOfQuestions !== (typeof quiz.noOfQuestions === "string" ? quiz.noOfQuestions : String(quiz.noOfQuestions ?? "")) ||
                JSON.stringify(parsed.questions) !== JSON.stringify(quiz.questions || [])
              );
              if (isDifferent && window.confirm("A saved draft was found for this quiz. Restore it?")) {
                setTitle(parsed.title);
                setDescription(parsed.description);
                setTopic(parsed.topic);
                setNoOfQuestions(parsed.noOfQuestions);
                setQuestions(parsed.questions || []);
              }
            }
          } catch { }
          // ============== (draft) ==============

        } else {
          setError("Quiz not found");
        }
      } catch (e: unknown) {
        let msg = "Failed to load quiz";
        if (e && typeof e === "object" && "message" in e) msg = String((e as { message?: string }).message) || msg;
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, fetchById, draftKey]);

  // Draft autosave (debounced) ============== (draft) ============== 
  useEffect(() => {
    const payload = { title, description, topic, noOfQuestions, questions };
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(payload)); } catch { }
    }, 600);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [title, description, topic, noOfQuestions, questions, draftKey]);
  // ============== (draft) ============== 

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (!questions.length) return false;
    return questions.every((q) => q.text.trim() && q.options.length >= 2 && q.options.every((o) => o.text.trim()));
  }, [title, questions]);

  const setQuestion = (qid: string, updater: (q: Question) => Question) => setQuestions((prev) => prev.map((q) => (q.id === qid ? updater(q) : q)));

  // Reorder helpers ============== (draft) ==============
  const moveQuestion = (qid: string, direction: "up" | "down") => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === qid);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const clone = [...prev];
      const [item] = clone.splice(idx, 1);
      clone.splice(newIdx, 0, item);
      return clone;
    });
  };

  const moveOption = (qid: string, oid: string, direction: "up" | "down") => {
    setQuestion(qid, (q) => {
      const idx = q.options.findIndex((o) => o.id === oid);
      if (idx === -1) return q;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= q.options.length) return q;
      const opts = [...q.options];
      const [item] = opts.splice(idx, 1);
      opts.splice(newIdx, 0, item);
      return { ...q, options: opts };
    });
  };
  // ============== (draft) ============== 

  const addQuestion = () => {
    const qid = `q${Date.now()}`;
    setQuestions((prev) => [
      ...prev,
      { id: qid, text: "", options: [{ id: `${qid}-a`, text: "" }, { id: `${qid}-b`, text: "" }], correctOptionId: `${qid}-a` },
    ]);
  };
  const removeQuestion = (qid: string) => setQuestions((prev) => prev.filter((q) => q.id !== qid));
  const addOption = (qid: string) => setQuestion(qid, (q) => {
    const oid = `${qid}-${String.fromCharCode(97 + q.options.length)}`;
    return { ...q, options: [...q.options, { id: oid, text: "" }] };
  });
  const removeOption = (qid: string, oid: string) => setQuestion(qid, (q) => {
    const opts = q.options.filter((o) => o.id !== oid);
    let correct = q.correctOptionId;
    if (!opts.find((o) => o.id === correct) && opts[0]) correct = opts[0].id;
    return { ...q, options: opts, correctOptionId: correct };
  });

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!instructorId) {
        setError("You must be signed in to update this quiz.");
        return;
      }
      await updateQuiz(
        id,
        {
          title: title.trim(),
          description: description.trim(),
          topic: topic.trim(),
          noOfQuestions: typeof noOfQuestions === "string" ? noOfQuestions.trim() : String(noOfQuestions ?? ""),
          questions,
        },
        instructorId,
      );

      // ============== (draft) ==============
      try { localStorage.removeItem(draftKey); } catch { }
      // ============== (draft) ==============

      router.back();
    } catch (e: unknown) {
      let msg = "Failed to update quiz";
      if (e && typeof e === "object" && "message" in e) msg = String((e as { message?: string }).message) || msg;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] w-full flex items-start justify-center p-6">
        <div className="w-full max-w-5xl space-y-4">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          <div className="h-28 w-full bg-muted animate-pulse rounded" />
          <div className="h-72 w-full bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[85vh] w-full flex items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] w-full flex items-start justify-center p-6"
      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
    >
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-bold leading-tight">Edit Quiz</h1>
          <ComponentIcon className="w-7 h-7 text-primary animate-pulse" />
        </div>

        {/* Hero-like summary card */}
        <Card className="w-full mb-6 shadow-lg border-2 backdrop-blur-sm">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-primary">Update quiz content</div>
                <div className="text-sm text-muted-foreground">Edit the title, topic, description, number of questions, and questions/options.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form card */}
        <Card className="w-full shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && <div className="text-destructive text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Topic</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Number of Questions</label>
                <Input value={noOfQuestions} onChange={(e) => setNoOfQuestions(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Questions: {questions.length}</span>
              <Button size="sm" variant="outline" onClick={addQuestion} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <Card key={q.id} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => moveQuestion(q.id, "up")} title="Move up">↑</Button>
                        <Button size="sm" variant="ghost" className="cursor-pointer" onClick={() => moveQuestion(q.id, "down")} title="Move down">↓</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Question text"
                      value={q.text}
                      onChange={(e) => setQuestion(q.id, (old) => ({ ...old, text: e.target.value }))}
                    />
                    <div className="space-y-2">
                      {q.options.map((o) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant={q.correctOptionId === o.id ? "default" : "outline"}
                            className="shrink-0 cursor-pointer"
                            onClick={() => setQuestion(q.id, (old) => ({ ...old, correctOptionId: o.id }))}
                            title="Mark as correct"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <div className="flex flex-col gap-1">
                            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 cursor-pointer" onClick={() => moveOption(q.id, o.id, "up")} title="Move option up">↑</Button>
                            <Button type="button" size="icon" variant="ghost" className="h-6 w-6 cursor-pointer" onClick={() => moveOption(q.id, o.id, "down")} title="Move option down">↓</Button>
                          </div>
                          <Input
                            className="flex-1"
                            placeholder="Option text"
                            value={o.text}
                            onChange={(e) => setQuestion(q.id, (old) => ({
                              ...old,
                              options: old.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)),
                            }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive cursor-pointer"
                            onClick={() => removeOption(q.id, o.id)}
                            title="Remove option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Button size="sm" variant="outline" onClick={() => addOption(q.id)} className="cursor-pointer">
                        <Plus className="w-4 h-4 mr-2" /> Add Option
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive cursor-pointer" onClick={() => removeQuestion(q.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Remove Question
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => router.back()} className="cursor-pointer">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!canSave || saving} className="cursor-pointer">Update</Button>
            </div> */}
          </CardContent>
        </Card>
        {/* Sticky footer actions (scoped to content width) */}
        <div className="sticky bottom-4 z-40 w-full px-2">
          <div className="rounded-md border bg-background/95 backdrop-blur shadow-md p-3 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSave || saving} className="cursor-pointer">{saving ? "Saving..." : "Update"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
