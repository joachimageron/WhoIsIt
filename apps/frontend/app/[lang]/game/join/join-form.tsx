"use client";

import type { Dictionary } from "@/dictionaries";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { addToast } from "@heroui/toast";
import { Form } from "@heroui/form";

import * as gameApi from "@/lib/game-api";
import { useAuth } from "@/lib/hooks/use-auth";

interface JoinFormProps {
  dict: Dictionary;
  lang: string;
}

export function JoinForm({ dict, lang }: JoinFormProps) {
  const router = useRouter();
  const { user, createGuestSession } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateRoomCode = (code: string): boolean => {
    // Room codes should be exactly 5 characters (uppercase alphanumeric)
    return code.trim().length === 5;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = roomCode.trim().toUpperCase();

    if (!trimmedCode) {
      setError(dict.game.join.enterRoomCode);

      return;
    }

    if (!validateRoomCode(trimmedCode)) {
      setError(dict.game.join.invalidRoomCode);

      return;
    }

    setIsLoading(true);

    try {
      // Join the game with user info if authenticated, or create guest
      let joinData;
      let currentUser = user;

      if (currentUser) {
        joinData = {
          username: currentUser.username,
          userId: currentUser.id,
          avatarUrl: currentUser.avatarUrl || undefined,
        };
      } else {
        // Create a guest user session
        const guestUsername = `Guest-${Math.random().toString(36).substring(2, 7)}`;

        currentUser = await createGuestSession(guestUsername);
        joinData = {
          username: currentUser.username,
        };
      }

      await gameApi.joinGame(trimmedCode, joinData);

      // Redirect to lobby page
      router.push(`/${lang}/game/lobby/${trimmedCode}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : dict.game.join.joinFailed;

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      addToast({
        color: "danger",
        title: dict.game.join.joinFailed,
        description: error,
      });
    }
  }, [error, dict]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-large flex w-full max-w-sm flex-col gap-4 px-8 pt-6 pb-10">
        <p className="pb-4 text-left text-3xl font-semibold">
          {dict.game.join.title}
        </p>
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            isRequired
            label={dict.game.join.roomCode}
            labelPlacement="outside"
            maxLength={5}
            name="roomCode"
            placeholder={dict.game.join.roomCodePlaceholder}
            type="text"
            value={roomCode}
            variant="bordered"
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          <Button fullWidth color="primary" isLoading={isLoading} type="submit">
            {isLoading ? dict.game.join.joining : dict.game.join.joinButton}
          </Button>
        </Form>
        <p className="text-small text-center">
          <Link href={`/${lang}`} size="sm">
            {dict.game.join.backToHome}
          </Link>
        </p>
      </div>
    </div>
  );
}
