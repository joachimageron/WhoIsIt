"use client";

import type {
  CharacterSetResponseDto,
  CreateGameRequest,
} from "@whois-it/contracts";
import type { Dictionary } from "@/dictionaries";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";
import { Form } from "@heroui/form";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

import * as gameApi from "@/lib/game-api";
import { useAuth } from "@/lib/hooks/use-auth";

interface CreateGameFormProps {
  dict: Dictionary;
  lang: string;
}

export function CreateGameForm({ dict, lang }: CreateGameFormProps) {
  const router = useRouter();
  const { user, createGuestSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [characterSets, setCharacterSets] = useState<CharacterSetResponseDto[]>(
    [],
  );
  const [loadingCharacterSets, setLoadingCharacterSets] = useState(true);
  const [selectedCharacterSet, setSelectedCharacterSet] = useState("");
  const [turnTimer, setTurnTimer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingGameData, setPendingGameData] = useState<{
    characterSetId: string;
    turnTimer: string;
  } | null>(null);

  useEffect(() => {
    const fetchCharacterSets = async () => {
      try {
        const sets = await gameApi.getCharacterSets();

        setCharacterSets(sets);
        setSelectedCharacterSet(sets[0]?.id ?? "");
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

    // Check if user is authenticated
    if (!user) {
      // Show auth modal if no user
      setPendingGameData({
        characterSetId: selectedCharacterSet,
        turnTimer,
      });
      setShowAuthModal(true);

      return;
    }

    // User is authenticated, proceed with game creation
    await createGameWithUser(selectedCharacterSet, turnTimer);
  };

  const createGameWithUser = async (characterSetId: string, timer: string) => {
    setIsLoading(true);

    try {
      const gameData: CreateGameRequest = {
        characterSetId,
        hostUsername: user!.username,
        hostUserId: user!.id,
      };

      // Add optional fields
      if (timer && parseInt(timer) > 0) {
        gameData.turnTimerSeconds = parseInt(timer);
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

  const handleContinueAsGuest = async () => {
    setShowAuthModal(false);
    setIsLoading(true);

    try {
      // Create guest session without username - backend will generate it
      const guestUser = await createGuestSession();

      // Create the game with the newly created guest user
      const gameData: CreateGameRequest = {
        characterSetId: pendingGameData!.characterSetId,
        hostUsername: guestUser.username,
        hostUserId: undefined,
      };

      // Add optional fields
      if (
        pendingGameData!.turnTimer &&
        parseInt(pendingGameData!.turnTimer) > 0
      ) {
        gameData.turnTimerSeconds = parseInt(pendingGameData!.turnTimer);
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
      setPendingGameData(null);
    }
  };

  const handleLogin = () => {
    setShowAuthModal(false);
    router.push(`/${lang}/auth/login`);
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
    <>
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-large flex w-full max-w-md flex-col gap-4 px-8 pt-6 pb-10">
          <p className="pb-4 text-left text-3xl font-semibold">
            {dict.game.create.title}
          </p>
          <p className="text-sm text-default-500">
            {dict.game.create.twoPlayerInfo ||
              "This game is played with exactly 2 players"}
          </p>
          <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
              label={dict.game.create.turnTimer}
              labelPlacement="outside"
              min="10"
              placeholder={dict.game.create.turnTimerPlaceholder}
              type="number"
              value={turnTimer}
              variant="bordered"
              onChange={(e) => setTurnTimer(e.target.value)}
            />
            <Button
              fullWidth
              color="primary"
              isLoading={isLoading}
              size="lg"
              type="submit"
            >
              {isLoading
                ? dict.game.create.creating
                : dict.game.create.createButton}
            </Button>
          </Form>
        </div>
      </div>

      <Modal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)}>
        <ModalContent>
          <ModalHeader>{dict.game.create.authRequired}</ModalHeader>
          <ModalBody>
            <p>{dict.game.create.authRequiredDescription}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="light"
              onPress={handleContinueAsGuest}
            >
              {dict.game.create.continueAsGuest}
            </Button>
            <Button color="primary" onPress={handleLogin}>
              {dict.game.create.loginButton}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
