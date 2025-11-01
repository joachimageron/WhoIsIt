"use client";

import type { GameStateResponse } from "@whois-it/contracts";

import React from "react";
import { Card, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

import { RoomCodeDisplay } from "@/components/room-code-display";

interface GameHeaderProps {
  dict: any;
  gameState: GameStateResponse;
  isConnected: boolean;
  isMyTurn: boolean;
  roomCode: string;
  questionCount: number;
  onLeaveGame: () => void;
}

export function GameHeader({
  dict,
  gameState,
  isConnected,
  isMyTurn,
  roomCode,
  questionCount,
  onLeaveGame,
}: GameHeaderProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold sm:text-2xl">{dict.play.title}</h1>
            <Chip
              color={isConnected ? "success" : "danger"}
              size="sm"
              startContent={
                <Icon
                  icon={
                    isConnected
                      ? "solar:check-circle-bold"
                      : "solar:close-circle-bold"
                  }
                  width={16}
                />
              }
              variant="flat"
            >
              {isConnected ? dict.lobby.connected : dict.lobby.disconnected}
            </Chip>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RoomCodeDisplay
              copyErrorMessage={dict.play.errors.failedToCopyRoomCode}
              copySuccessMessage={dict.play.roomCodeCopied}
              label={`${dict.play.roomCode}:`}
              roomCode={roomCode}
              showLabel={true}
              size="sm"
            />

            <span className="mx-2 text-default-300">|</span>

            <div className="flex items-center gap-2">
              <span className="text-sm text-default-500">
                {dict.play.turn || dict.play.round}:
              </span>
              <span className="font-semibold">{questionCount + 1}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center sm:flex-col sm:items-end gap-2">
          {isMyTurn ? (
            <Chip
              color="primary"
              size="lg"
              startContent={<Icon icon="solar:play-bold" width={20} />}
              variant="flat"
            >
              {dict.play.yourTurn}
            </Chip>
          ) : (
            <Chip color="default" size="lg" variant="flat">
              {dict.play.playerTurn.replace(
                "{player}",
                gameState.activePlayerUsername || "...",
              )}
            </Chip>
          )}

          <Button
            color="danger"
            size="sm"
            startContent={<Icon icon="solar:logout-2-bold" width={16} />}
            variant="light"
            onPress={onLeaveGame}
          >
            {dict.play.abandonGame}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
