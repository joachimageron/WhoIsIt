"use client";

import type { GameStateResponse } from "@whois-it/contracts";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";

import * as gameApi from "@/lib/game-api";

interface QuestionsPanelProps {
  dict: any;
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
  const [targetPlayerId, setTargetPlayerId] = useState<string>(gameState.players.filter(
    (p) => p.id !== currentPlayerId,
  )[0]?.id || "");
  const [isAsking, setIsAsking] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      addToast({
        color: "warning",
        title: dict.play.errors.enterQuestion,
      });

      return;
    }

    if (!isMyTurn) {
      addToast({
        color: "warning",
        title: dict.play.errors.notYourTurn,
      });

      return;
    }

    if (!currentPlayerId) {
      addToast({
        color: "danger",
        title: dict.play.errors.failedToAskQuestion,
      });

      return;
    }

    setIsAsking(true);

    try {
      await gameApi.askQuestion(roomCode, {
        playerId: currentPlayerId,
        targetPlayerId: targetPlayerId || undefined,
        questionText: question.trim(),
      });

      // Clear form
      setQuestion("");
      setTargetPlayerId("");

      addToast({
        color: "success",
        title: dict.play.askButton,
        description: "Question sent successfully",
      });
    } catch (error) {
      addToast({
        color: "danger",
        title: dict.play.errors.failedToAskQuestion,
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
      <CardHeader>
        <h2 className="text-lg font-semibold">{dict.play.questionsPanel}</h2>
      </CardHeader>
      <CardBody className="gap-3">
        {/* Target Player Selection (optional) */}
        {otherPlayers.length > 0 && (
          <Select
            isDisabled={!isMyTurn || isAsking}
            label={dict.play.selectPlayer}
            placeholder={dict.play.selectPlayer}
            selectedKeys={targetPlayerId ? [targetPlayerId] : []}
            size="sm"
            variant="bordered"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];

              setTargetPlayerId(selected ? String(selected) : "");
            }}
          >
            {otherPlayers.map((player) => (
              <SelectItem key={player.id}>{player.username}</SelectItem>
            ))}
          </Select>
        )}

        {/* Question Input */}
        <Textarea
          isDisabled={!isMyTurn || isAsking}
          label={dict.play.questionsPanel}
          maxRows={4}
          minRows={3}
          placeholder={dict.play.questionPlaceholder}
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
          {isAsking ? dict.play.asking : dict.play.askButton}
        </Button>

        {!isMyTurn && (
          <p className="text-center text-sm text-default-400">
            {dict.play.waitingForTurn}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
