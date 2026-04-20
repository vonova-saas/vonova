"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, CheckCircle, Component as ComponentIcon, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { createNewQuizMutationFn } from "@/services/student/lms/quizzes/quiz.api";
import { generateQuizWithAIMutationFn } from "@/services/instructor/lms/quiz-generation/ai-quiz.api";
import { useAuthContext } from "@/context/app/auth/auth-context";
import type { QuizType, Question, createQuizType } from "@/types/api/student/lms/quizzes/quiz.type";

export function CreateQuiz() {
  const router = useRouter();
  const { user } = useAuthContext();
  const userId = user?._id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [noOfQuestions, setNoOfQuestions] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Generation states
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLevel, setAiLevel] = useState<"easy" | "medium" | "hard">("medium");
  const [aiTotalQuestions, setAiTotalQuestions] = useState<number>(10);
  const [aiMcQuestions, setAiMcQuestions] = useState<number>(5);
  const [aiTfQuestions, setAiTfQuestions] = useState<number>(5);
  const [generatingAI, setGeneratingAI] = useState(false);

  const canSave = useMemo(() => {
    if (!title.trim() || !topic.trim() || !noOfQuestions.trim()) return false;
    if (!questions.length) return false;
    return questions.every((q) => {
      const text = typeof q.text === 'string' ? q.text : String(q.text ?? '');
      return text.trim() && q.options.length >= 2 && q.options.every((o) => {
        const optText = typeof o.text === 'string' ? o.text : String(o.text ?? '');
        return optText.trim();
      });
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

  const removeQuestion = (qid: string) => setQuestions((prev) => prev.filter((q) => q.id !== qid));
  const setQuestion = (qid: string, updater: (q: Question) => Question) => setQuestions((prev) => prev.map((q) => (q.id === qid ? updater(q) : q)));
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

      if (!userId) {
        throw new Error("User not authenticated");
      }

      const payload: Omit<QuizType, "_id"> = {
        title: title.trim(),
        description: description.trim(),
        topic: topic.trim(),
        noOfQuestions,
        questions,
      };
      await createNewQuizMutationFn(userId, payload as createQuizType);
      router.back();
    } catch (e: unknown) {
      let msg = "Failed to create quiz";
      if (e && typeof e === "object" && "message" in e) msg = String((e as { message?: string }).message) || msg;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex items-start justify-center p-6"
      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(120,120,120,0.2) 1.5px, transparent 1.5px)", backgroundSize: "18px 18px" }}
    >
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-4xl font-bold leading-tight">Create Quiz</h1>
          <ComponentIcon className="w-7 h-7 text-primary animate-pulse" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIGenerator(true)}
            className="ml-auto cursor-pointer bg-primary/10 hover:bg-primary/20 border-primary/30"
          >
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            <span className="text-primary font-medium">Generate with AI</span>
          </Button>
        </div>

        {/* Hero-like summary card */}
        <Card className="w-full mb-6 shadow-lg border-2 backdrop-blur-sm">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 text-primary rounded-full p-4 flex items-center justify-center shadow-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-primary">Design a great learning experience</div>
                <div className="text-sm text-muted-foreground">Add questions, options and mark the correct answers. Keep it clear and concise.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form card centered */}
        <Card className="w-full shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && <div className="text-destructive text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. JavaScript Basics" />
              </div>
              <div>
                <label className="text-sm font-medium">Topic</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. JavaScript" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description of the quiz" />
              </div>
              <div>
                <label className="text-sm font-medium">Number of Questions</label>
                <Input value={noOfQuestions} onChange={(e) => setNoOfQuestions(e.target.value)} placeholder="e.g. 10" />
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
                    <CardTitle className="text-base">Question {idx + 1}</CardTitle>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => router.back()} className="cursor-pointer">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!canSave || saving} className="cursor-pointer">Create</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Generator Dialog */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Generate Quiz with AI
            </DialogTitle>
            <DialogDescription>
              Let AI generate quiz questions based on your topic and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">{error}</div>}
            <div>
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <Input
                placeholder="e.g., JavaScript Basics, World History..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty Level</label>
              <Select value={aiLevel} onValueChange={(v) => setAiLevel(v as "easy" | "medium" | "hard")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Total</label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={aiTotalQuestions}
                  onChange={(e) => setAiTotalQuestions(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">MC Questions</label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={aiMcQuestions}
                  onChange={(e) => setAiMcQuestions(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">T/F Questions</label>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={aiTfQuestions}
                  onChange={(e) => setAiTfQuestions(Number(e.target.value))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: MC (Multiple Choice) + T/F (True/False) should equal Total questions.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAIGenerator(false)} disabled={generatingAI} className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleAIGenerate}
              disabled={!aiTopic.trim() || generatingAI || aiMcQuestions + aiTfQuestions !== aiTotalQuestions}
              className="cursor-pointer"
            >
              {generatingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  async function handleAIGenerate() {
    try {
      setGeneratingAI(true);
      setError(null);

      const response = await generateQuizWithAIMutationFn({
        topic: aiTopic.trim(),
        total_questions: aiTotalQuestions,
        mc_questions: aiMcQuestions,
        tf_questions: aiTfQuestions,
        level: aiLevel,
      });

      // Populate the form with AI-generated data
      setTitle(`Quiz on ${response.topic}`);
      setTopic(response.topic);
      setNoOfQuestions(String(response.total_questions));
      setDescription(`AI-generated ${aiLevel} level quiz about ${response.topic}.`);

      // Convert AI questions to the Question type format
      // Parse the rich question objects from AI API
      const parsedQuestions: Question[] = response.questions.map((qItem, index) => {
        const qid = `ai-q${Date.now()}-${index}`;

        // Handle the AI response format with question, options, correct_answer
        if (qItem && typeof qItem === 'object') {
          const qData = qItem as {
            type?: string;
            question?: string;
            options?: string[];
            correct_answer?: string
          };

          const questionText = qData.question ?? 'Untitled Question';
          const qType = qData.type ?? 'mc';
          const correctAnswer = qData.correct_answer ?? 'A';

          let options: { id: string; text: string }[] = [];
          let correctOptionId: string;

          if (qType === 'tf') {
            // True/False question
            options = [
              { id: `${qid}-a`, text: "True" },
              { id: `${qid}-b`, text: "False" },
            ];
            // correct_answer is "True" or "False" for TF questions
            correctOptionId = correctAnswer.toLowerCase() === 'true' ? `${qid}-a` : `${qid}-b`;
          } else {
            // Multiple Choice question
            // Parse options like "A: Server-side rendering" -> extract text after ": "
            const rawOptions = qData.options ?? ['A: Option A', 'B: Option B', 'C: Option C', 'D: Option D'];
            options = rawOptions.map((opt, idx) => {
              const letter = String.fromCharCode(97 + idx); // a, b, c, d...
              // Extract text after ": " if present, otherwise use full text
              const text = opt.includes(': ') ? opt.split(': ').slice(1).join(': ') : opt;
              return { id: `${qid}-${letter}`, text };
            });
            // correct_answer is "A", "B", "C", "D" for MC questions
            const correctLetter = correctAnswer.toLowerCase();
            correctOptionId = `${qid}-${correctLetter}`;
          }

          return {
            id: qid,
            text: questionText,
            options,
            correctOptionId,
          };
        }

        // Fallback for string format (shouldn't happen with current API)
        return {
          id: qid,
          text: String(qItem ?? ''),
          options: [
            { id: `${qid}-a`, text: "Option A" },
            { id: `${qid}-b`, text: "Option B" },
            { id: `${qid}-c`, text: "Option C" },
            { id: `${qid}-d`, text: "Option D" },
          ],
          correctOptionId: `${qid}-a`,
        };
      });

      setQuestions(parsedQuestions);
      setShowAIGenerator(false);
    } catch (e: unknown) {
      let msg = "Failed to generate quiz with AI";
      if (e && typeof e === "object" && "message" in e) msg = String((e as { message?: string }).message) || msg;
      setError(msg);
    } finally {
      setGeneratingAI(false);
    }
  }
}
