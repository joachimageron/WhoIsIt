"use client";

import type { QuestionResponse } from "@whois-it/contracts";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { ScrollShadow } from "@heroui/scroll-shadow";

interface QuestionHistoryProps {
  dict: any;
  questions: QuestionResponse[];
}

export function QuestionHistory({ dict, questions }: QuestionHistoryProps) {
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
}

function QuestionItem({ dict, question }: QuestionItemProps) {
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

      <div className="flex items-center gap-2">
        <Chip
          color={question.category === "direct" ? "primary" : "default"}
          size="sm"
          variant="dot"
        >
          {question.category}
        </Chip>
        <Chip color="default" size="sm" variant="flat">
          {question.answerType}
        </Chip>
      </div>
    </div>
  );
}
