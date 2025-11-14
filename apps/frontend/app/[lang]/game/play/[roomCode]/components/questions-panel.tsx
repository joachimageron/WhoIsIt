"use client";

import type { GameStateResponse } from "@whois-it/contracts";
import type { Dictionary } from "@/dictionaries";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";

import * as gameApi from "@/lib/game-api";

interface QuestionsPanelProps {
  dict: Dictionary;
  gameState: GameStateResponse;
  isMyTurn: boolean;
  roomCode: string;
  currentPlayerId: string | null;
}

export function QuestionsPanel({
  dict,
  gameState,
  isMyTurn,
  roomCode,
  currentPlayerId,
}: QuestionsPanelProps) {
  const [question, setQuestion] = useState("");
  // In a 2-player game, always target the opponent
  const otherPlayer = gameState.players.filter(
    (p) => p.id !== currentPlayerId,
  )[0];
  const targetPlayerId = otherPlayer?.id || "";
  const [isAsking, setIsAsking] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      addToast({
        color: "warning",
        title: dict.game.play.questions.enterQuestion,
      });

      return;
    }

    if (!isMyTurn) {
      addToast({
        color: "warning",
        title: dict.game.play.errors.notYourTurn,
      });

      return;
    }

    if (!currentPlayerId) {
      addToast({
        color: "danger",
        title: dict.game.play.errors.failedToAskQuestion,
      });

      return;
    }

    if (!targetPlayerId) {
      addToast({
        color: "danger",
        title: dict.game.play.errors.failedToAskQuestion,
        description: "Could not find opponent player",
      });

      return;
    }

    setIsAsking(true);

    try {
      await gameApi.askQuestion(roomCode, {
        playerId: currentPlayerId,
        targetPlayerId: targetPlayerId,
        questionText: question.trim(),
      });

      // Clear question text
      setQuestion("");

      addToast({
        color: "success",
        title: dict.game.play.questions.askButton,
        description: "Question sent successfully",
      });
    } catch (error) {
      addToast({
        color: "danger",
        title: dict.game.play.errors.failedToAskQuestion,
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsAsking(false);
    }
  };

  const otherPlayers = gameState.players.filter(
    (p) => p.id !== currentPlayerId,
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 items-start">
        <h2 className="text-lg font-semibold">
          {dict.game.play.questions.questionsPanel}
        </h2>
                {/* Show opponent name in 2-player mode */}
        {otherPlayers.length > 0 && (
          <p className="text-sm text-default-600">
            Asking:{" "}
            <span className="font-semibold">{otherPlayers[0].username}</span>
          </p>
        )}
      </CardHeader>
      <CardBody className="gap-3">
        {/* Question Input */}
        <Textarea
          isDisabled={!isMyTurn || isAsking}
          label={dict.game.play.questions.questionsPanel}
          maxRows={4}
          minRows={3}
          placeholder={dict.game.play.questions.questionPlaceholder}
          value={question}
          variant="bordered"
          onChange={(e) => setQuestion(e.target.value)}
        />

        {/* Submit Button */}
        <Button
          color="primary"
          isDisabled={!isMyTurn}
          isLoading={isAsking}
          startContent={<Icon icon="solar:document-add-bold" width={20} />}
          onPress={handleAskQuestion}
        >
          {isAsking
            ? dict.game.play.questions.asking
            : dict.game.play.questions.askButton}
        </Button>

        {!isMyTurn && (
          <p className="text-center text-sm text-default-400">
            {dict.game.play.waitingForTurn}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
