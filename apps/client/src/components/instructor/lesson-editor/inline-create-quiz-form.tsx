"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { createNewQuizMutationFn } from "@/services/student/lms/quizzes/quiz.api";
import type {
  Question,
  QuizVisibility,
  createQuizType,
} from "@/types/api/student/lms/quizzes/quiz.type";
import { toast } from "sonner";
import { VisibilityField } from "./resource-primitives";

type InlineCreateQuizFormProps = {
  courseId: string;
  lessonId: string;
  onCancel: () => void;
  onCreated: (created: { id: string; title: string }) => void;
};

export function InlineCreateQuizForm({
  courseId,
  lessonId,
  onCancel,
  onCreated,
}: InlineCreateQuizFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [noOfQuestions, setNoOfQuestions] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [visibility, setVisibility] = useState<QuizVisibility>("PRIVATE");
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    if (!title.trim() || !topic.trim() || !noOfQuestions.trim()) return false;
    if (!questions.length) return false;
    return questions.every((q) => {
      const text = typeof q.text === "string" ? q.text : String(q.text ?? "");
      return (
        text.trim() &&
        q.options.length >= 2 &&
        q.options.every((o) => {
          const t = typeof o.text === "string" ? o.text : String(o.text ?? "");
          return t.trim();
        })
      );
    });
  }, [title, topic, noOfQuestions, questions]);

  const addQuestion = () => {
    const qid = `q${Date.now()}`;
    setQuestions((prev) => [
      ...prev,
      {
        id: qid,
        text: "",
        options: [
          { id: `${qid}-a`, text: "" },
          { id: `${qid}-b`, text: "" },
        ],
        correctOptionId: `${qid}-a`,
      },
    ]);
  };

  const removeQuestion = (qid: string) =>
    setQuestions((prev) => prev.filter((q) => q.id !== qid));

  const setQuestion = (qid: string, updater: (q: Question) => Question) =>
    setQuestions((prev) => prev.map((q) => (q.id === qid ? updater(q) : q)));

  const addOption = (qid: string) =>
    setQuestion(qid, (q) => {
      const oid = `${qid}-${String.fromCharCode(97 + q.options.length)}`;
      return { ...q, options: [...q.options, { id: oid, text: "" }] };
    });

  const removeOption = (qid: string, oid: string) =>
    setQuestion(qid, (q) => {
      const opts = q.options.filter((o) => o.id !== oid);
      let correct = q.correctOptionId;
      if (!opts.find((o) => o.id === correct) && opts[0]) correct = opts[0].id;
      return { ...q, options: opts, correctOptionId: correct };
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) {
      toast.error("Fill in title, topic, # questions, and at least one full question.");
      return;
    }
    setSaving(true);
    try {
      const payload: createQuizType = {
        title: title.trim(),
        description: description.trim(),
        topic: topic.trim(),
        noOfQuestions,
        questions,
        visibility,
        courseId,
        lessonId,
      };
      const res = await createNewQuizMutationFn(payload);
      const id =
        (res as { data?: { _id?: string; id?: string } })?.data?._id ??
        (res as { data?: { _id?: string; id?: string } })?.data?.id ??
        (res as unknown as { _id?: string; id?: string })._id ??
        (res as unknown as { _id?: string; id?: string }).id;
      if (!id) throw new Error("Server did not return a quiz id");
      onCreated({ id, title: title.trim() });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to create quiz";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="inline-quiz-title">
            Title
          </label>
          <Input
            id="inline-quiz-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. JavaScript Basics"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="inline-quiz-topic">
            Topic
          </label>
          <Input
            id="inline-quiz-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. JavaScript"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium" htmlFor="inline-quiz-description">
            Description
          </label>
          <Textarea
            id="inline-quiz-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="inline-quiz-noq">
            Number of Questions
          </label>
          <Input
            id="inline-quiz-noq"
            value={noOfQuestions}
            onChange={(e) => setNoOfQuestions(e.target.value)}
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <VisibilityField
        value={visibility}
        onChange={setVisibility}
        resourceLabel="quiz"
        managementLabel="Quiz Management library"
        disabled={saving}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Questions: {questions.length}
        </span>
        <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
          <Plus className="mr-2 h-4 w-4" /> Add Question
        </Button>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <Card key={q.id} className="border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Question {idx + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Question text"
                value={q.text}
                onChange={(e) =>
                  setQuestion(q.id, (old) => ({ ...old, text: e.target.value }))
                }
              />
              <div className="space-y-2">
                {q.options.map((o) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant={q.correctOptionId === o.id ? "default" : "outline"}
                      className="shrink-0"
                      onClick={() =>
                        setQuestion(q.id, (old) => ({
                          ...old,
                          correctOptionId: o.id,
                        }))
                      }
                      title="Mark as correct"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Input
                      className="flex-1"
                      placeholder="Option text"
                      value={o.text}
                      onChange={(e) =>
                        setQuestion(q.id, (old) => ({
                          ...old,
                          options: old.options.map((x) =>
                            x.id === o.id ? { ...x, text: e.target.value } : x,
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeOption(q.id, o.id)}
                      title="Remove option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addOption(q.id)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Option
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeQuestion(q.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSave || saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
            </>
          ) : (
            "Create & attach"
          )}
        </Button>
      </div>
    </form>
  );
}
