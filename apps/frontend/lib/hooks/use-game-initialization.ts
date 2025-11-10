import type { Dictionary } from "@/dictionaries";

import { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";

import * as gameApi from "@/lib/game-api";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/lib/hooks/use-game-socket";
import { getGuestSession } from "@/lib/guest-session";

interface UseGameInitializationProps {
  roomCode: string;
  lang: string;
  dict: Dictionary;
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
      // Check if user is authenticated or is a guest
      const guestSession = getGuestSession();
      const currentUser =
        user ||
        (guestSession
          ? {
              id: guestSession.id,
              username: guestSession.username,
              email: "",
              avatarUrl: null,
            }
          : null);

      if (!currentUser) {
        // No authenticated user and no guest session
        setIsLoading(false);

        return;
      }

      try {
        setIsLoading(true);

        // Get game state
        const gameState = await gameApi.getGameState(roomCode);

        setGameState(gameState);

        // Find current player - check both username and userId
        const player = gameState.players.find(
          (p) =>
            p.username === currentUser.username || p.userId === currentUser.id,
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
          throw new Error(response.error || dict.game.play.errors.failedToLoad);
        }

        setIsLoading(false);
      } catch (error) {
        addToast({
          color: "danger",
          title: dict.game.play.errors.failedToLoad,
          description: error instanceof Error ? error.message : String(error),
        });
        router.push(`/${lang}`);
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
