import type { AnswerValue } from "@whois-it/contracts";
import type { Dictionary } from "@/dictionaries";

import { useState, useCallback } from "react";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";

import * as gameApi from "@/lib/game-api";
import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/lib/hooks/use-game-socket";

interface UseGameActionsProps {
  roomCode: string;
  currentPlayerId: string | null;
  lang: string;
  dict: Dictionary;
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
  const { playState, eliminateCharacter } = useGameStore();

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
    setIsGuessModalOpen(true);
  }, []);

  const handleConfirmGuess = useCallback(
    async (characterId: string) => {
      if (!characterId) {
        return;
      }

      if (!currentPlayerId) {
        addToast({
          color: "danger",
          title: dict.game.play.errors.failedToGuess || "Failed to guess",
          description: "Player ID not found",
        });

        return;
      }

      if (!playState?.gameState) {
        addToast({
          color: "danger",
          title: dict.game.play.errors.failedToGuess || "Failed to guess",
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
          targetCharacterId: characterId,
        });

        setIsGuessModalOpen(false);

        if (guess.isCorrect) {
          addToast({
            color: "success",
            title: dict.game.play.guess.correctGuess || "Correct guess!",
            description: `You guessed correctly: ${guess.targetCharacterName}`,
          });
        } else {
          // Eliminate the incorrectly guessed character
          eliminateCharacter(guess.targetCharacterId);
        }
      } catch (error) {
        addToast({
          color: "danger",
          title: dict.game.play.errors.failedToGuess || "Failed to guess",
          description: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsGuessing(false);
      }
    },
    [currentPlayerId, roomCode, dict, playState, eliminateCharacter],
  );

  const handleSubmitAnswer = useCallback(
    async (
      questionId: string,
      answerValue: AnswerValue,
      answerText?: string,
    ) => {
      if (!currentPlayerId) {
        addToast({
          color: "danger",
          title:
            dict.game.play.errors.failedToAnswer || "Failed to submit answer",
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

        setPendingQuestion(null);
        setIsAnswerModalOpen(false);
      } catch (error) {
        addToast({
          color: "danger",
          title:
            dict.game.play.errors.failedToAnswer || "Failed to submit answer",
          description: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [currentPlayerId, roomCode, dict, setPendingQuestion, setIsAnswerModalOpen],
  );

  return {
    isGuessModalOpen,
    setIsGuessModalOpen,
    isGuessing,
    handleLeaveGame,
    handleOpenGuessModal,
    handleConfirmGuess,
    handleSubmitAnswer,
  };
}
