"use client";

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
  const { socket, joinRoom, leaveRoom, onQuestionAsked } = useGameSocket();
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

  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
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
  }, [roomCode]);

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
    });

    return () => {
      unsubscribeQuestionAsked();
    };
  }, [onQuestionAsked, addQuestion, setGameState]);

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

  const handleGuess = useCallback(async (_characterId: string) => {
    // TODO: Implement guess API call when backend is ready
    // For now, just show a toast
    addToast({
      color: "primary",
      title: "Guess feature coming soon",
      description:
        "The guess functionality will be available once the backend is ready.",
    });
  }, []);

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
    </div>
  );
}
