"use client";

import type { QuestionResponse, AnswerValue } from "@whois-it/contracts";

import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { RadioGroup, Radio } from "@heroui/radio";
import { Textarea } from "@heroui/input";

interface AnswerModalProps {
  dict: any;
  question: QuestionResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnswer: (
    questionId: string,
    answerValue: AnswerValue,
    answerText?: string,
  ) => Promise<void>;
}

export function AnswerModal({
  dict,
  question,
  isOpen,
  onClose,
  onSubmitAnswer,
}: AnswerModalProps) {
  const [answerValue, setAnswerValue] = useState<AnswerValue>("yes");
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question) return;

    setIsSubmitting(true);

    try {
      await onSubmitAnswer(
        question.id,
        answerValue,
        answerText.trim() || undefined,
      );
      setAnswerValue("yes");
      setAnswerText("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) return null;

  return (
    <Modal
      backdrop="blur"
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      isOpen={isOpen}
      size="lg"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Icon icon="solar:question-circle-bold" width={24} />
            <span>{dict.play.answerQuestion || "Answer Question"}</span>
          </div>
        </ModalHeader>
        <ModalBody className="pb-6">
          {/* Question Info */}
          <div className="mb-4 rounded-lg bg-default-100 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-default-600">
              <Icon icon="solar:user-bold" width={16} />
              <span className="font-medium">
                {question.askedByPlayerUsername}
              </span>
              <Chip color="default" size="sm" variant="flat">
                {dict.play.round} {question.roundNumber}
              </Chip>
            </div>
            <p className="text-base font-medium">{question.questionText}</p>
            <div className="mt-2 flex items-center gap-2">
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

          {/* Answer Input */}
          {question.answerType === "boolean" ? (
            <RadioGroup
              isDisabled={isSubmitting}
              label={dict.play.yourAnswer || "Your Answer"}
              value={answerValue}
              onValueChange={(value) => setAnswerValue(value as AnswerValue)}
            >
              <Radio value="yes">
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-success"
                    icon="solar:check-circle-bold"
                    width={20}
                  />
                  <span>{dict.play.yes || "Yes"}</span>
                </div>
              </Radio>
              <Radio value="no">
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-danger"
                    icon="solar:close-circle-bold"
                    width={20}
                  />
                  <span>{dict.play.no || "No"}</span>
                </div>
              </Radio>
              <Radio value="unsure">
                <div className="flex items-center gap-2">
                  <Icon
                    className="text-warning"
                    icon="solar:question-circle-bold"
                    width={20}
                  />
                  <span>{dict.play.unsure || "Unsure"}</span>
                </div>
              </Radio>
            </RadioGroup>
          ) : (
            <Textarea
              isDisabled={isSubmitting}
              label={dict.play.yourAnswer || "Your Answer"}
              maxRows={4}
              minRows={2}
              placeholder={dict.play.answerPlaceholder || "Type your answer..."}
              value={answerText}
              variant="bordered"
              onChange={(e) => setAnswerText(e.target.value)}
            />
          )}

          {/* Optional Text Answer for Boolean Questions */}
          {question.answerType === "boolean" && (
            <Textarea
              isDisabled={isSubmitting}
              label={dict.play.optionalDetails || "Optional Details (Optional)"}
              maxRows={3}
              minRows={2}
              placeholder={
                dict.play.optionalDetailsPlaceholder ||
                "Add any additional details..."
              }
              value={answerText}
              variant="bordered"
              onChange={(e) => setAnswerText(e.target.value)}
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button isDisabled={isSubmitting} variant="flat" onPress={onClose}>
              {dict.play.cancel || "Cancel"}
            </Button>
            <Button
              color="primary"
              isLoading={isSubmitting}
              startContent={
                !isSubmitting && (
                  <Icon icon="solar:check-circle-bold" width={20} />
                )
              }
              onPress={handleSubmit}
            >
              {isSubmitting
                ? dict.play.submitting || "Submitting..."
                : dict.play.submitAnswer || "Submit Answer"}
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
