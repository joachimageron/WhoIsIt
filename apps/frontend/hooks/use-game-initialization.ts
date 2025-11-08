import { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";

import * as gameApi from "@/lib/game-api";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/hooks/use-game-socket";

interface UseGameInitializationProps {
  roomCode: string;
  lang: string;
  dict: any;
}

export function useGameInitialization({
  roomCode,
  lang,
  dict,
}: UseGameInitializationProps) {
  const router = useRouter();
  const { joinRoom } = useGameSocket();
  const {
    setGameState,
    setCharacters,
    setMyCharacter,
    addQuestion,
    addAnswer,
  } = useGameStore();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [lobby, setLobby] = useState<any>(null);

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

        // Load player's assigned character
        if (player) {
          try {
            const myCharacter = await gameApi.getPlayerCharacter(
              roomCode,
              player.id,
            );

            setMyCharacter(myCharacter);
          } catch {
            // Character might not be assigned yet if game hasn't started
            // Silently ignore this error
          }
        }

        // Load existing questions and answers (for reconnection/refresh)
        const [questions, answers] = await Promise.all([
          gameApi.getQuestions(roomCode),
          gameApi.getAnswers(roomCode),
        ]);

        // Add questions to store
        questions.forEach((q) => addQuestion(q));

        // Add answers to store
        answers.forEach((a) => addAnswer(a));

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

  return {
    isLoading,
    currentPlayerId,
    lobby,
  };
}
