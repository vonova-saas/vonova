"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Question, QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import { CheckCircle, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  quiz?: QuizType;
  onCancel: () => void;
  onCreate: (payload: Omit<QuizType, "_id">) => Promise<void> | void;
  onUpdate: (id: string, payload: Omit<QuizType, "_id">) => Promise<void> | void;
};

export default function InstructorQuizForm({ quiz, onCancel, onCreate, onUpdate }: Props) {
  const isEdit = !!quiz;
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [topic, setTopic] = useState(quiz?.topic ?? "");
  const [noOfQuestions, setNoOfQuestions] = useState<string>(
    quiz?.noOfQuestions !== undefined && quiz?.noOfQuestions !== null
      ? String(quiz.noOfQuestions)
      : "",
  );
  const [questions, setQuestions] = useState<Question[]>(quiz?.questions ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noOfQuestions && Number(noOfQuestions) > 0 && questions.length === 0) {
      // initialize one question to guide user
      handleAddQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalQs = questions.length;

  const handleAddQuestion = () => {
    const qId = `q${Date.now()}`;
    const newQ: Question = {
      id: qId,
      text: "",
      options: [
        { id: `${qId}-a`, text: "" },
        { id: `${qId}-b`, text: "" }
      ],
      correctOptionId: `${qId}-a`,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleRemoveQuestion = (qid: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qid));
  };

  const updateQuestion = (qid: string, updater: (q: Question) => Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === qid ? updater(q) : q)));
  };

  const handleAddOption = (qid: string) => {
    updateQuestion(qid, (q) => {
      const oid = `${qid}-${String.fromCharCode(97 + q.options.length)}`;
      const opts = [...q.options, { id: oid, text: "" }];
      return { ...q, options: opts };
    });
  };

  const handleRemoveOption = (qid: string, oid: string) => {
    updateQuestion(qid, (q) => {
      const opts = q.options.filter((o) => o.id !== oid);
      let correct = q.correctOptionId;
      if (!opts.find((o) => o.id === correct) && opts[0]) correct = opts[0].id;
      return { ...q, options: opts, correctOptionId: correct };
    });
  };

  const canSave = useMemo(() => {
    if (!title.trim() || !topic.trim() || !noOfQuestions.trim()) return false;
    if (!questions.length) return false;
    return questions.every((q) => q.text.trim() && q.options.length >= 2 && q.options.every((o) => o.text.trim()));
  }, [title, topic, noOfQuestions, questions]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload: Omit<QuizType, "_id"> = {
        title: title.trim(),
        description: description.trim(),
        topic: topic.trim(),
        noOfQuestions: noOfQuestions,
        questions,
      };
      if (isEdit && quiz) {
        await onUpdate(quiz._id, payload);
      } else {
        await onCreate(payload);
      }
    } catch (e: unknown) {
      let msg = "Failed to save quiz";
      if (e && typeof e === "object" && "message" in e) msg = String((e as { message?: string }).message) || msg;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Quiz" : "Create Quiz"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
            <span className="text-sm text-muted-foreground">Questions: {totalQs}</span>
            <Button size="sm" variant="outline" onClick={handleAddQuestion} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-auto pr-1">
            {questions.map((q, qIdx) => (
              <Card key={q.id} className="border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Question {qIdx + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Question text"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, (old) => ({ ...old, text: e.target.value }))}
                  />
                  <div className="space-y-2">
                    {q.options.map((o) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant={q.correctOptionId === o.id ? "default" : "outline"}
                          className="shrink-0 cursor-pointer"
                          onClick={() => updateQuestion(q.id, (old) => ({ ...old, correctOptionId: o.id }))}
                          title="Mark as correct"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Input
                          className="flex-1"
                          placeholder="Option text"
                          value={o.text}
                          onChange={(e) => updateQuestion(q.id, (old) => ({
                            ...old,
                            options: old.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)),
                          }))}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive cursor-pointer"
                          onClick={() => handleRemoveOption(q.id, o.id)}
                          title="Remove option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="outline" onClick={() => handleAddOption(q.id)} className="cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" /> Add Option
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive cursor-pointer" onClick={() => handleRemoveQuestion(q.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Remove Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSave || saving} className="cursor-pointer">{isEdit ? "Update" : "Create"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
