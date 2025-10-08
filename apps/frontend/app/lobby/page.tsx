"use client";

import type { GameLobbyResponse } from "@whois-it/contracts";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";

import { useGameSocket } from "@/hooks/use-game-socket";

export default function LobbyTestPage() {
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [lobby, setLobby] = useState<GameLobbyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    socket,
    joinRoom,
    leaveRoom,
    updatePlayerReady,
    onLobbyUpdate,
    onPlayerJoined,
  } = useGameSocket();

  useEffect(() => {
    const unsubscribeLobbyUpdate = onLobbyUpdate((updatedLobby) => {
      console.log("Lobby update received:", updatedLobby);
      setLobby(updatedLobby);
    });

    const unsubscribePlayerJoined = onPlayerJoined((event) => {
      console.log("Player joined:", event);
    });

    return () => {
      unsubscribeLobbyUpdate();
      unsubscribePlayerJoined();
    };
  }, [onLobbyUpdate, onPlayerJoined]);

  const handleJoinRoom = async () => {
    if (!roomCode) {
      setError("Please enter a room code");

      return;
    }

    setError(null);
    const response = await joinRoom({ roomCode });

    if (response.success && response.lobby) {
      setLobby(response.lobby);
      console.log("Successfully joined room:", response.lobby);
    } else {
      setError(response.error || "Failed to join room");
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomCode) {
      return;
    }

    await leaveRoom({ roomCode });
    setLobby(null);
    console.log("Left room");
  };

  const handleToggleReady = async (selectedPlayerId: string) => {
    if (!roomCode || !lobby) {
      return;
    }

    const player = lobby.players.find((p) => p.id === selectedPlayerId);

    if (!player) {
      return;
    }

    const response = await updatePlayerReady({
      roomCode,
      playerId: selectedPlayerId,
      isReady: !player.isReady,
    });

    if (response.success && response.lobby) {
      setLobby(response.lobby);
      console.log("Updated player ready state");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="mb-4">
        <CardHeader>
          <h1 className="text-2xl font-bold">Socket.IO Lobby Test</h1>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Chip color={socket.connected ? "success" : "danger"}>
                {socket.connected ? "Connected" : "Disconnected"}
              </Chip>
              <p className="text-sm text-gray-600">Socket ID: {socket.id}</p>
            </div>

            <div className="flex gap-2">
              <Input
                label="Room Code"
                placeholder="Enter room code (e.g., ABCDE)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
              <Button color="primary" onPress={handleJoinRoom}>
                Join Room
              </Button>
              <Button color="danger" onPress={handleLeaveRoom}>
                Leave Room
              </Button>
            </div>

            {error && (
              <div className="rounded-md bg-red-100 p-3 text-red-800">
                {error}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {lobby && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">
              Lobby: {lobby.roomCode} ({lobby.status})
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-2">
              <p>
                <strong>ID:</strong> {lobby.id}
              </p>
              <p>
                <strong>Status:</strong> {lobby.status}
              </p>
              <p>
                <strong>Visibility:</strong> {lobby.visibility}
              </p>
              <p>
                <strong>Character Set ID:</strong> {lobby.characterSetId}
              </p>
              {lobby.maxPlayers && (
                <p>
                  <strong>Max Players:</strong> {lobby.maxPlayers}
                </p>
              )}

              <Divider className="my-4" />

              <h3 className="text-lg font-semibold">
                Players ({lobby.players.length})
              </h3>
              <div className="space-y-2">
                {lobby.players.map((player) => (
                  <Card key={player.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{player.displayName}</p>
                        <div className="flex gap-2 text-sm text-gray-600">
                          <Chip color="primary" size="sm">
                            {player.role}
                          </Chip>
                          <Chip
                            color={player.isReady ? "success" : "warning"}
                            size="sm"
                          >
                            {player.isReady ? "Ready" : "Not Ready"}
                          </Chip>
                        </div>
                      </div>
                      <Button
                        color={player.isReady ? "warning" : "success"}
                        size="sm"
                        onPress={() => handleToggleReady(player.id)}
                      >
                        {player.isReady ? "Mark Not Ready" : "Mark Ready"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-4">
                <Input
                  label="Player ID (for testing ready toggle)"
                  placeholder="Enter player ID"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
