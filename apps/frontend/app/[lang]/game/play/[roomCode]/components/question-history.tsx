"use client";

import type { QuestionResponse, AnswerResponse } from "@whois-it/contracts";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { ScrollShadow } from "@heroui/scroll-shadow";

interface QuestionHistoryProps {
  dict: any;
  questions: QuestionResponse[];
  answers: Map<string, AnswerResponse>;
}

export function QuestionHistory({
  dict,
  questions,
  answers,
}: QuestionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{dict.play.history}</h2>
      </CardHeader>
      <CardBody>
        {questions.length === 0 ? (
          <p className="text-center text-sm text-default-400">
            {dict.play.noQuestionsYet}
          </p>
        ) : (
          <ScrollShadow className="max-h-[400px]">
            <div className="flex flex-col gap-3">
              {[...questions].reverse().map((question) => (
                <QuestionItem
                  key={question.id}
                  answer={answers.get(question.id)}
                  dict={dict}
                  question={question}
                />
              ))}
            </div>
          </ScrollShadow>
        )}
      </CardBody>
    </Card>
  );
}

interface QuestionItemProps {
  dict: any;
  question: QuestionResponse;
  answer?: AnswerResponse;
}

function QuestionItem({ dict, question, answer }: QuestionItemProps) {
  // Determine answer color based on value
  const getAnswerColor = (
    answerValue: string,
  ): "success" | "danger" | "warning" => {
    switch (answerValue) {
      case "yes":
        return "success";
      case "no":
        return "danger";
      case "unsure":
        return "warning";
      default:
        return "warning";
    }
  };

  return (
    <div className="rounded-lg border border-default-200 bg-default-50 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 text-xs text-default-500">
          <Icon icon="solar:user-bold" width={14} />
          <span className="font-medium">{question.askedByPlayerUsername}</span>
          {question.targetPlayerUsername && (
            <>
              <Icon icon="solar:arrow-right-linear" width={14} />
              <span className="font-medium">
                {question.targetPlayerUsername}
              </span>
            </>
          )}
        </div>

        <Chip color="default" size="sm" variant="flat">
          {dict.play.round} {question.roundNumber}
        </Chip>
      </div>

      <p className="mb-2 text-sm">{question.questionText}</p>

      {answer && (
        <div className="mt-2 flex items-center gap-2 border-t border-default-200 pt-2">
          <Chip
            color={getAnswerColor(answer.answerValue)}
            size="sm"
            variant="flat"
          >
            {answer.answerValue.toUpperCase()}
          </Chip>
          {answer.answerText && (
            <span className="text-sm text-default-500">
              {answer.answerText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
