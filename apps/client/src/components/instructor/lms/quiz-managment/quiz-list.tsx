"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizType } from "@/types/api/student/lms/quizzes/quiz.type";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
  quizzes: QuizType[];
  onEdit: (quiz: QuizType) => void;
  onDelete: (id: string) => void;
};

export default function InstructorQuizList({ quizzes, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
      {quizzes.length === 0 ? (
        <div className="col-span-2 text-center text-muted-foreground py-8">No quizzes found.</div>
      ) : (
        quizzes.map((quiz) => (
          <Card key={quiz._id} className="hover:shadow-lg transition-shadow flex flex-col justify-between h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                {quiz.title}
                <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold ml-2 align-middle">
                  {quiz.noOfQuestions} Questions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 justify-between">
              <p className="mb-4 text-muted-foreground min-h-[48px]">{quiz.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => onEdit(quiz)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => onDelete(quiz._id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
