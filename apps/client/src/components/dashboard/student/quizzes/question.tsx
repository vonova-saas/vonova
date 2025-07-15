import { Question } from "./types";
import { Button } from "@/components/ui/button";
import React from "react";

type QuestionProps = {
  question: Question;
  selectedOptionId?: string;
  onAnswer: (questionId: string, optionId: string) => void;
};

export default function QuestionComponent({ question, selectedOptionId, onAnswer }: QuestionProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{question.text}</h2>
      <div className="flex flex-col gap-3">
        {question.options.map((option) => (
          <Button
            key={option.id}
            variant={selectedOptionId === option.id ? "default" : "outline"}
            className="justify-start"
            onClick={() => onAnswer(question.id, option.id)}
            disabled={!!selectedOptionId}
          >
            {option.text}
          </Button>
        ))}
      </div>
    </div>
  );
} 