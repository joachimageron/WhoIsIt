"use client";

import type { CharacterSetResponseDto } from "@whois-it/contracts";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";

import * as gameApi from "@/lib/game-api";
import { useAuthStore } from "@/store/auth-store";

interface CreateGameFormProps {
  dict: any;
  lang: string;
}

export function CreateGameForm({ dict, lang }: CreateGameFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [characterSets, setCharacterSets] = useState<CharacterSetResponseDto[]>(
    [],
  );
  const [loadingCharacterSets, setLoadingCharacterSets] = useState(true);
  const [selectedCharacterSet, setSelectedCharacterSet] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [turnTimer, setTurnTimer] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacterSets = async () => {
      try {
        const sets = await gameApi.getCharacterSets();

        setCharacterSets(sets);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : dict.game.create.creationFailed,
        );
      } finally {
        setLoadingCharacterSets(false);
      }
    };

    fetchCharacterSets();
  }, [dict]);

  useEffect(() => {
    if (error) {
      addToast({
        color: "danger",
        title: dict.game.create.creationFailed,
        description: error,
      });
    }
  }, [error, dict]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedCharacterSet) {
      setError(dict.game.create.fillCharacterSet);

      return;
    }

    setIsLoading(true);

    try {
      const gameData: any = {
        characterSetId: selectedCharacterSet,
      };

      // Add user info if authenticated
      if (user) {
        gameData.hostUserId = user.id;
        gameData.hostUsername = user.username;
      } else {
        // For guest users, we need a username
        gameData.hostUsername = "Guest";
      }

      // Add optional fields
      if (maxPlayers && parseInt(maxPlayers) > 0) {
        gameData.maxPlayers = parseInt(maxPlayers);
      }
      if (turnTimer && parseInt(turnTimer) > 0) {
        gameData.turnTimerSeconds = parseInt(turnTimer);
      }

      const lobby = await gameApi.createGame(gameData);

      // Redirect to lobby
      router.push(`/${lang}/game/lobby/${lobby.roomCode}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : dict.game.create.creationFailed,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingCharacterSets) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-large flex w-full max-w-md flex-col gap-4 px-8 pt-6 pb-10">
          <p className="text-center text-xl">
            {dict.game.create.loadingCharacterSets}
          </p>
        </div>
      </div>
    );
  }

  if (characterSets.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-large flex w-full max-w-md flex-col gap-4 px-8 pt-6 pb-10">
          <p className="text-center text-xl text-danger">
            {dict.game.create.noCharacterSets}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-md flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          {dict.game.create.title}
        </p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Select
            isRequired
            label={dict.game.create.characterSet}
            labelPlacement="outside"
            placeholder={dict.game.create.characterSetPlaceholder}
            selectedKeys={selectedCharacterSet ? [selectedCharacterSet] : []}
            variant="bordered"
            onChange={(e) => setSelectedCharacterSet(e.target.value)}
          >
            {characterSets.map((set) => (
              <SelectItem key={set.id}>{set.name}</SelectItem>
            ))}
          </Select>
          <Input
            label={dict.game.create.maxPlayers}
            labelPlacement="outside"
            min="2"
            placeholder={dict.game.create.maxPlayersPlaceholder}
            type="number"
            value={maxPlayers}
            variant="bordered"
            onChange={(e) => setMaxPlayers(e.target.value)}
          />
          <Input
            label={dict.game.create.turnTimer}
            labelPlacement="outside"
            min="10"
            placeholder={dict.game.create.turnTimerPlaceholder}
            type="number"
            value={turnTimer}
            variant="bordered"
            onChange={(e) => setTurnTimer(e.target.value)}
          />
          <Button color="primary" isLoading={isLoading} size="lg" type="submit">
            {isLoading
              ? dict.game.create.creating
              : dict.game.create.createButton}
          </Button>
        </form>
      </div>
    </div>
  );
}
