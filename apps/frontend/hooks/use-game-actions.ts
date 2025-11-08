import type { AnswerValue } from "@whois-it/contracts";

import { useState, useCallback } from "react";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";

import * as gameApi from "@/lib/game-api";
import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/hooks/use-game-socket";

interface UseGameActionsProps {
  roomCode: string;
  currentPlayerId: string | null;
  lang: string;
  dict: any;
  setPendingQuestion: (question: any) => void;
  setIsAnswerModalOpen: (isOpen: boolean) => void;
}

export function useGameActions({
  roomCode,
  currentPlayerId,
  lang,
  dict,
  setPendingQuestion,
  setIsAnswerModalOpen,
}: UseGameActionsProps) {
  const router = useRouter();
  const { leaveRoom } = useGameSocket();
  const { playState } = useGameStore();

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [isGuessing, setIsGuessing] = useState(false);

  const handleLeaveGame = useCallback(async () => {
    try {
      if (currentPlayerId) {
        await leaveRoom({ roomCode, playerId: currentPlayerId });
      }
    } catch {
      // Ignore errors when leaving
    } finally {
      router.push(`/${lang}`);
    }
  }, [roomCode, currentPlayerId, leaveRoom, router, lang]);

  const handleOpenGuessModal = useCallback(() => {
    if (!selectedCharacterId) {
      addToast({
        color: "warning",
        title: dict.play.errors.selectCharacter || "Please select a character",
        description:
          dict.play.errors.selectCharacterDescription ||
          "Select a character from the grid before making a guess",
      });

      return;
    }

    setIsGuessModalOpen(true);
  }, [selectedCharacterId, dict]);

  const handleConfirmGuess = useCallback(async () => {
    if (!selectedCharacterId) {
      return;
    }

    if (!currentPlayerId) {
      addToast({
        color: "danger",
        title: dict.play.errors.failedToGuess || "Failed to guess",
        description: "Player ID not found",
      });

      return;
    }

    if (!playState?.gameState) {
      addToast({
        color: "danger",
        title: dict.play.errors.failedToGuess || "Failed to guess",
        description: "Game state not found",
      });

      return;
    }

    // Find the target player (in a 2-player game, it's the opponent)
    // In multiplayer games, the user should specify which player they're guessing
    const otherPlayers = playState.gameState.players.filter(
      (p) => p.id !== currentPlayerId,
    );

    let targetPlayerId: string | undefined;

    if (otherPlayers.length === 1) {
      // In a 2-player game, automatically target the opponent
      targetPlayerId = otherPlayers[0].id;
    } else if (otherPlayers.length > 1) {
      // In multiplayer, we need to ask which player they're guessing
      // For now, we'll leave it undefined (TODO: add player selection in guess modal)
      targetPlayerId = undefined;
    }

    setIsGuessing(true);

    try {
      const guess = await gameApi.submitGuess(roomCode, {
        playerId: currentPlayerId,
        targetPlayerId,
        targetCharacterId: selectedCharacterId,
      });

      setIsGuessModalOpen(false);
      setSelectedCharacterId(null);

      if (guess.isCorrect) {
        addToast({
          color: "success",
          title: dict.play.correctGuess || "Correct guess!",
          description: `You guessed correctly: ${guess.targetCharacterName}`,
        });
      } else {
        addToast({
          color: "danger",
          title: dict.play.incorrectGuess || "Incorrect guess",
          description: "Your guess was incorrect. You have been eliminated.",
        });
      }
    } catch (error) {
      addToast({
        color: "danger",
        title: dict.play.errors.failedToGuess || "Failed to guess",
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsGuessing(false);
    }
  }, [selectedCharacterId, currentPlayerId, roomCode, dict, playState]);

  const handleSubmitAnswer = useCallback(
    async (
      questionId: string,
      answerValue: AnswerValue,
      answerText?: string,
    ) => {
      if (!currentPlayerId) {
        addToast({
          color: "danger",
          title: dict.play.errors.failedToAnswer || "Failed to submit answer",
          description: "Player ID not found",
        });

        return;
      }

      try {
        await gameApi.submitAnswer(roomCode, {
          playerId: currentPlayerId,
          questionId,
          answerValue,
          answerText,
        });

        addToast({
          color: "success",
          title: dict.play.answerSubmitted || "Answer submitted",
          description: "Your answer has been submitted successfully",
        });

        setPendingQuestion(null);
        setIsAnswerModalOpen(false);
      } catch (error) {
        addToast({
          color: "danger",
          title: dict.play.errors.failedToAnswer || "Failed to submit answer",
          description: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [currentPlayerId, roomCode, dict, setPendingQuestion, setIsAnswerModalOpen],
  );

  return {
    selectedCharacterId,
    setSelectedCharacterId,
    isGuessModalOpen,
    setIsGuessModalOpen,
    isGuessing,
    handleLeaveGame,
    handleOpenGuessModal,
    handleConfirmGuess,
    handleSubmitAnswer,
  };
}
