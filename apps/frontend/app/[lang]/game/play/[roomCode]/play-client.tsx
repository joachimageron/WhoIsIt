"use client";

import type { QuestionResponse, AnswerValue } from "@whois-it/contracts";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";

import { CharacterGrid } from "./components/character-grid";
import { QuestionsPanel } from "./components/questions-panel";
import { QuestionHistory } from "./components/question-history";
import { GameHeader } from "./components/game-header";
import { GuessModal } from "./components/guess-modal";
import { TurnTimer } from "./components/turn-timer";
import { AnswerModal } from "./components/answer-modal";

import * as gameApi from "@/lib/game-api";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/hooks/use-game-socket";

interface GamePlayClientProps {
  dict: any;
  lang: string;
  roomCode: string;
}

export function GamePlayClient({ dict, lang, roomCode }: GamePlayClientProps) {
  const router = useRouter();
  const {
    socket,
    joinRoom,
    leaveRoom,
    onQuestionAsked,
    onAnswerSubmitted,
    onGuessResult,
    onGameOver,
  } = useGameSocket();
  const {
    playState,
    setGameState,
    setCharacters,
    addQuestion,
    isConnected,
    setConnected,
  } = useGameStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isGuessModalOpen, setIsGuessModalOpen] = useState(false);
  const [lobby, setLobby] = useState<any>(null);
  const [pendingQuestion, setPendingQuestion] =
    useState<QuestionResponse | null>(null);
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);

  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
      if (!user) return;
      try {
        setIsLoading(true);

        // Get game state
        const gameState = await gameApi.getGameState(roomCode);

        setGameState(gameState);

        // Find current player
        const player = gameState.players.find(
          (p) => p.username === user?.username || p.userId === user?.id,
        );

        if (player) {
          setCurrentPlayerId(player.id);
        }

        // Get lobby to retrieve characterSetId and turnTimerSeconds
        const lobbyData = await gameApi.getLobby(roomCode);

        setLobby(lobbyData);

        // Load characters
        const characters = await gameApi.getCharacters(
          lobbyData.characterSetId,
        );

        setCharacters(characters);

        // Join via Socket.IO for real-time updates
        const response = await joinRoom({
          roomCode,
          playerId: player?.id,
        });

        if (!response.success) {
          throw new Error(response.error || dict.play.errors.failedToLoad);
        }
      } catch (error) {
        addToast({
          color: "danger",
          title: dict.play.errors.failedToLoad,
          description: error instanceof Error ? error.message : String(error),
        });
        router.push(`/${lang}`);
      } finally {
        setIsLoading(false);
      }
    };

    initGame();
  }, [roomCode, user]);

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

      // Check if this question is directed at the current player
      if (
        event.question.targetPlayerId &&
        event.question.targetPlayerId === currentPlayerId
      ) {
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
      addToast({
        color: "success",
        title: dict.play.answerSubmitted || "Answer submitted",
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
  }, [onAnswerSubmitted, setGameState, dict, pendingQuestion]);

  // Listen to guess result events
  useEffect(() => {
    const unsubscribeGuessResult = onGuessResult((event) => {
      setGameState(event.gameState);
      const { guess } = event;

      if (guess.isCorrect) {
        addToast({
          color: "success",
          title: dict.play.correctGuess || "Correct guess!",
          description: `${guess.guessedByPlayerUsername} guessed correctly: ${guess.targetCharacterName}`,
        });
      } else {
        addToast({
          color: "danger",
          title: dict.play.incorrectGuess || "Incorrect guess",
          description: `${guess.guessedByPlayerUsername} guessed incorrectly and is eliminated`,
        });
      }
    });

    return () => {
      unsubscribeGuessResult();
    };
  }, [onGuessResult, setGameState, dict]);

  // Listen to game over events
  useEffect(() => {
    const unsubscribeGameOver = onGameOver((event) => {
      addToast({
        color: "success",
        title: dict.play.gameOver || "Game Over!",
        description: event.result.winnerUsername
          ? `${event.result.winnerUsername} won the game!`
          : "Game ended",
      });
      // Navigate to results page
      router.push(`/${lang}/game/results/${roomCode}`);
    });

    return () => {
      unsubscribeGameOver();
    };
  }, [onGameOver, router, lang, roomCode, dict]);

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

  const handleGuess = useCallback(
    async (characterId: string) => {
      if (!currentPlayerId) {
        addToast({
          color: "danger",
          title: dict.play.errors.failedToGuess || "Failed to guess",
          description: "Player ID not found",
        });

        return;
      }

      try {
        const guess = await gameApi.submitGuess(roomCode, {
          playerId: currentPlayerId,
          targetCharacterId: characterId,
        });

        setIsGuessModalOpen(false);

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
      }
    },
    [currentPlayerId, roomCode, dict],
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
    [currentPlayerId, roomCode, dict],
  );

  if (isLoading || !playState || !playState.gameState) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon
            className="animate-spin text-primary"
            icon="solar:loader-linear"
            width={48}
          />
          <p className="text-lg">{dict.play.loadingGame}</p>
        </div>
      </div>
    );
  }

  const { gameState, characters, questions } = playState;
  const isMyTurn = gameState.activePlayerId === currentPlayerId;

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <GameHeader
        dict={dict}
        gameState={gameState}
        isConnected={isConnected}
        isMyTurn={isMyTurn}
        roomCode={roomCode}
        onLeaveGame={handleLeaveGame}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Character Grid - Left/Top */}
        <div className="lg:col-span-2">
          <CharacterGrid
            characters={characters}
            dict={dict}
            eliminatedIds={playState.eliminatedCharacterIds}
          />
        </div>

        {/* Right Panel - Questions, Timer, and History */}
        <div className="flex flex-col gap-4">
          {/* Turn Timer */}
          {lobby?.turnTimerSeconds && (
            <TurnTimer
              dict={dict}
              isMyTurn={isMyTurn}
              turnTimerSeconds={lobby.turnTimerSeconds}
            />
          )}

          {/* Make a Guess Button */}
          <Card>
            <CardBody className="p-3">
              <Button
                fullWidth
                color="success"
                isDisabled={!isMyTurn}
                startContent={<Icon icon="solar:target-bold" width={20} />}
                variant="shadow"
                onPress={() => setIsGuessModalOpen(true)}
              >
                {dict.play.guessPanel}
              </Button>
            </CardBody>
          </Card>

          {/* Questions Panel */}
          <QuestionsPanel
            currentPlayerId={currentPlayerId}
            dict={dict}
            gameState={gameState}
            isMyTurn={isMyTurn}
            roomCode={roomCode}
          />

          {/* Question History */}
          <QuestionHistory dict={dict} questions={questions} />
        </div>
      </div>

      {/* Guess Modal */}
      <GuessModal
        characters={characters}
        dict={dict}
        eliminatedIds={playState.eliminatedCharacterIds}
        isOpen={isGuessModalOpen}
        onClose={() => setIsGuessModalOpen(false)}
        onGuess={handleGuess}
      />

      {/* Answer Modal */}
      <AnswerModal
        dict={dict}
        isOpen={isAnswerModalOpen}
        question={pendingQuestion}
        onClose={() => {
          setIsAnswerModalOpen(false);
          setPendingQuestion(null);
        }}
        onSubmitAnswer={handleSubmitAnswer}
      />
    </div>
  );
}
