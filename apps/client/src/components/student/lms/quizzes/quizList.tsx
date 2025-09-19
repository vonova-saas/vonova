"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuizType } from "./types";
import React from "react";
import Link from "next/link";
import useStudentId from "@/hooks/student/use-student-id";

type QuizListProps = {
  quizzes: QuizType[];
};

export default function QuizList({ quizzes }: QuizListProps) {
  const studentId = useStudentId();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
      {quizzes.length === 0 ? (
        <div className="col-span-2 text-center text-muted-foreground py-8">
          No quizzes found.
        </div>
      ) : (
        quizzes.map((quiz) => (
          <Card
            key={quiz.id}
            className="hover:shadow-lg transition-shadow flex flex-col justify-between h-full"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                {quiz.title}
                <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold ml-2 align-middle">
                  {quiz.noOfQuestions} Questions
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 justify-between">
              <p className="mb-4 text-muted-foreground min-h-[48px]">
                {quiz.description}
              </p>
              <Link
                href={`/student/${studentId}/quizzes/${quiz.id}`}
                className="w-full mt-4"
              >
                <Button className="w-full cursor-pointer">Attempt Now</Button>
              </Link>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
