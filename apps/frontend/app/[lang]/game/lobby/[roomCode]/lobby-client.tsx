"use client";

import type { GamePlayerResponse } from "@whois-it/contracts";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";

import { useGameSocket } from "@/hooks/use-game-socket";
import { useGameStore } from "@/store/game-store";
import { useAuthStore } from "@/store/auth-store";
import * as gameApi from "@/lib/game-api";

interface LobbyClientProps {
  dict: any;
  lang: string;
  roomCode: string;
}

export function LobbyClient({ dict, lang, roomCode }: LobbyClientProps) {
  const router = useRouter();
  const {
    socket,
    joinRoom,
    leaveRoom,
    updatePlayerReady,
    onLobbyUpdate,
    onPlayerJoined,
    onPlayerLeft,
    onGameStarted,
  } = useGameSocket();
  const { lobby, setLobby, isConnected, setConnected } = useGameStore();
  const { user } = useAuthStore();
  const [isJoining, setIsJoining] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isTogglingReady, setIsTogglingReady] = useState(false);

  // Get current player
  const currentPlayer = lobby?.players.find(
    (p) => p.username === user?.username || p.userId === user?.id,
  );
  const isHost = currentPlayer?.role === "host";
  const allPlayersReady =
    lobby?.players.every((p) => p.isReady) && (lobby?.players.length ?? 0) > 0;

  // Join room on mount
  useEffect(() => {
    const initLobby = async () => {
      try {
        // First get the lobby data from REST API
        const lobbyData = await gameApi.getLobby(roomCode);

        setLobby(lobbyData);

        // Find current player in the lobby data
        const player = lobbyData.players.find(
          (p) => p.username === user?.username || p.userId === user?.id,
        );

        // Then join via Socket.IO for real-time updates
        const response = await joinRoom({
          roomCode,
          playerId: player?.id,
        });

        if (response.success && response.lobby) {
          setLobby(response.lobby);
        } else {
          throw new Error(response.error || dict.lobby.errors.failedToJoin);
        }
      } catch (error) {
        addToast({
          color: "danger",
          title: dict.lobby.errors.failedToJoin,
          description: error instanceof Error ? error.message : String(error),
        });
        router.push(`/${lang}`);
      } finally {
        setIsJoining(false);
      }
    };

    initLobby();
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

  // Listen to lobby updates
  useEffect(() => {
    const unsubscribeLobbyUpdate = onLobbyUpdate((updatedLobby) => {
      setLobby(updatedLobby);
    });

    const unsubscribePlayerJoined = onPlayerJoined((event) => {
      setLobby(event.lobby);
    });

    const unsubscribePlayerLeft = onPlayerLeft((event) => {
      setLobby(event.lobby);
    });

    const unsubscribeGameStarted = onGameStarted((event) => {
      setLobby(event.lobby);
      addToast({
        color: "success",
        title: dict.lobby.gameStarting,
        description: dict.lobby.redirectingToGame,
      });
      // Navigate to game page
      router.push(`/${lang}/game/play/${event.roomCode}`);
    });

    return () => {
      unsubscribeLobbyUpdate();
      unsubscribePlayerJoined();
      unsubscribePlayerLeft();
      unsubscribeGameStarted();
    };
  }, [
    onLobbyUpdate,
    onPlayerJoined,
    onPlayerLeft,
    onGameStarted,
    setLobby,
    dict,
    router,
    lang,
  ]);

  const handleToggleReady = useCallback(async () => {
    if (!currentPlayer) return;

    setIsTogglingReady(true);

    try {
      const response = await updatePlayerReady({
        roomCode,
        playerId: currentPlayer.id,
        isReady: !currentPlayer.isReady,
      });

      if (response.success && response.lobby) {
        setLobby(response.lobby);
      } else {
        throw new Error(
          response.error || dict.lobby.errors.failedToUpdateReady,
        );
      }
    } catch (error) {
      addToast({
        color: "danger",
        title: dict.lobby.errors.failedToUpdateReady,
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsTogglingReady(false);
    }
  }, [
    currentPlayer,
    roomCode,
    updatePlayerReady,
    setLobby,
    dict.lobby.errors.failedToUpdateReady,
  ]);

  const handleStartGame = useCallback(async () => {
    setIsStarting(true);

    try {
      await gameApi.startGame(roomCode);
      // After starting, the backend will update the game status
      // and we'll receive a lobbyUpdate event
      addToast({
        color: "success",
        title: "Game Starting!",
        description: "The game is starting now...",
      });
    } catch (error) {
      addToast({
        color: "danger",
        title: dict.lobby.errors.failedToStartGame,
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsStarting(false);
    }
  }, [roomCode, dict.lobby.errors.failedToStartGame]);

  const handleLeaveLobby = useCallback(async () => {
    try {
      // Leave the room via Socket.IO
      if (currentPlayer) {
        await leaveRoom({ roomCode, playerId: currentPlayer.id });
      }
    } catch {
      // Ignore errors when leaving
    } finally {
      router.push(`/${lang}`);
    }
  }, [roomCode, currentPlayer, leaveRoom, router, lang]);

  if (isJoining || !lobby) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon
            className="animate-spin text-primary"
            icon="solar:loader-linear"
            width={48}
          />
          <p className="text-lg">{dict.lobby.connecting}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-3 pb-4">
          <div className="flex w-full items-center justify-between">
            <h1 className="text-2xl font-bold">{dict.lobby.title}</h1>
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
          <div className="flex w-full items-center justify-between">
            <div>
              <p className="text-small text-default-500">
                {dict.lobby.roomCode}
              </p>
              <p className="text-large font-semibold">{lobby.roomCode}</p>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4 py-4">
          {/* Players Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {dict.lobby.players} ({lobby.players.length}
                {lobby.maxPlayers ? `/${lobby.maxPlayers}` : ""})
              </h2>
            </div>

            {lobby.players.length === 0 ? (
              <p className="text-small text-default-400">
                {dict.lobby.waitingForPlayers}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {lobby.players.map((player: GamePlayerResponse) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-medium bg-default-100 p-3"
                  >
                    <div className="flex gap-4 items-start">
                      <Badge
                        color={player.isReady ? "success" : "danger"}
                        content={
                          player.isReady ? (
                            <Icon
                              className="text-default-100"
                              icon="iconamoon:check-bold"
                              width={14}
                            />
                          ) : (
                            <Icon
                              className="text-default-100"
                              icon="iconamoon:close-bold"
                              width={14}
                            />
                          )
                        }
                        placement="bottom-left"
                        shape="circle"
                      >
                        <Avatar
                          name={player.username}
                          size="lg"
                          src={player.avatarUrl}
                        />
                      </Badge>
                      <div className="flex items-start gap-1 flex-col">
                        <p className="font-medium">{player.username}</p>

                        {player.role === "host" && (
                          <Chip color="primary" size="sm" variant="flat">
                            {dict.lobby.host}
                          </Chip>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Messages */}
          {allPlayersReady && (
            <Chip
              color="success"
              size="lg"
              startContent={<Icon icon="solar:check-circle-bold" width={20} />}
              variant="flat"
            >
              {dict.lobby.allPlayersReady}
            </Chip>
          )}

          {!allPlayersReady && (
            <Chip color="default" size="lg" variant="flat">
              {dict.lobby.notAllPlayersReady}
            </Chip>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {currentPlayer && !isHost && (
              <Button
                className="flex-1"
                color={currentPlayer.isReady ? "default" : "primary"}
                isLoading={isTogglingReady}
                onPress={handleToggleReady}
              >
                {currentPlayer.isReady
                  ? dict.lobby.toggleNotReady
                  : dict.lobby.toggleReady}
              </Button>
            )}

            {isHost && (
              <Button
                className="flex-1"
                color="primary"
                isDisabled={!allPlayersReady || lobby.players.length < 2}
                isLoading={isStarting}
                onPress={handleStartGame}
              >
                {dict.lobby.startGame}
              </Button>
            )}

            <Button color="danger" variant="light" onPress={handleLeaveLobby}>
              {dict.lobby.leaveLobby}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
