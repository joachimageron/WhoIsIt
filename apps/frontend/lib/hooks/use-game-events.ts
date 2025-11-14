import type { QuestionResponse } from "@whois-it/contracts";
import type { Dictionary } from "@/dictionaries";

import { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";

import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/lib/hooks/use-game-socket";

interface UseGameEventsProps {
  currentPlayerId: string | null;
  roomCode: string;
  lang: string;
  dict: Dictionary;
}

export function useGameEvents({
  currentPlayerId,
  roomCode,
  lang,
  dict,
}: UseGameEventsProps) {
  const router = useRouter();
  const {
    socket,
    onQuestionAsked,
    onAnswerSubmitted,
    onGuessResult,
    onGameOver,
  } = useGameSocket();
  const {
    setGameState,
    addQuestion,
    addAnswer,
    setConnected,
    eliminateCharacter,
    resetPlayState,
  } = useGameStore();

  const [pendingQuestion, setPendingQuestion] =
    useState<QuestionResponse | null>(null);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);

  // Listen to socket connection status
  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    setConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, setConnected]);

  // Listen to question asked events
  useEffect(() => {
    const unsubscribeQuestionAsked = onQuestionAsked((event) => {
      addQuestion(event.question);
      setGameState(event.gameState);

      // Check if this question can be answered by the current player
      // Case 1: Question is specifically targeted at this player
      // Case 2: Question has no target, so any player except the asker can answer
      const canAnswer =
        (event.question.targetPlayerId &&
          event.question.targetPlayerId === currentPlayerId) ||
        (!event.question.targetPlayerId &&
          event.question.askedByPlayerId !== currentPlayerId);

      if (canAnswer) {
        setPendingQuestion(event.question);
        setIsAnswerModalOpen(true);
      }
    });

    return () => {
      unsubscribeQuestionAsked();
    };
  }, [onQuestionAsked, addQuestion, setGameState, currentPlayerId]);

  // Listen to answer submitted events
  useEffect(() => {
    const unsubscribeAnswerSubmitted = onAnswerSubmitted((event) => {
      setGameState(event.gameState);
      addAnswer(event.answer);
      addToast({
        color: "success",
        title: dict.game.play.answers.answerSubmitted || "Answer submitted",
        description: `${event.answer.answeredByPlayerUsername} answered the question`,
      });

      // Clear pending question if it was answered
      if (pendingQuestion && event.answer.questionId === pendingQuestion.id) {
        setPendingQuestion(null);
        setIsAnswerModalOpen(false);
      }
    });

    return () => {
      unsubscribeAnswerSubmitted();
    };
  }, [onAnswerSubmitted, setGameState, addAnswer, dict, pendingQuestion]);

  // Listen to guess result events
  useEffect(() => {
    const unsubscribeGuessResult = onGuessResult((event) => {
      setGameState(event.gameState);
      const { guess } = event;

      if (guess.isCorrect) {
        addToast({
          color: "success",
          title: dict.game.play.guess.correctGuess || "Correct guess!",
          description: `${guess.guessedByPlayerUsername} guessed correctly: ${guess.targetCharacterName}`,
        });
      } else {
        // Eliminate the incorrectly guessed character
        eliminateCharacter(guess.targetCharacterId);

        addToast({
          color: "danger",
          title: dict.game.play.guess.incorrectGuess || "Incorrect guess",
          description: `${guess.guessedByPlayerUsername} guessed incorrectly`,
        });
      }
    });

    return () => {
      unsubscribeGuessResult();
    };
  }, [onGuessResult, setGameState, dict, eliminateCharacter]);

  // Listen to game over events
  useEffect(() => {
    const unsubscribeGameOver = onGameOver((event) => {
      addToast({
        color: "success",
        title: dict.game.play.gameOver || "Game Over!",
        description: event.result.winnerUsername
          ? `${event.result.winnerUsername} won the game!`
          : "Game ended",
      });
      // Reset play state before navigating to results
      resetPlayState();
      // Navigate to results page
      router.push(`/${lang}/game/results/${roomCode}`);
    });

    return () => {
      unsubscribeGameOver();
    };
  }, [onGameOver, router, lang, roomCode, dict, resetPlayState]);

  return {
    pendingQuestion,
    setPendingQuestion,
    isAnswerModalOpen,
    setIsAnswerModalOpen,
  };
}
