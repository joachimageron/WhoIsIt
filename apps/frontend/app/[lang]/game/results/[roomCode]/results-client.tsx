"use client";

import type { GameResultsResponse, GameStatus } from "@whois-it/contracts";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";

import { useAuthStore } from "@/store/auth-store";

interface Dictionary {
  results: {
    title: string;
    winner: string;
    congratulations: string;
    youWon: string;
    youLost: string;
    gameStats: string;
    playerStats: string;
    detailedStats: string;
    you: string;
    roomCode: string;
    duration: string;
    rounds: string;
    placement: string;
    username: string;
    score: string;
    questionsAsked: string;
    questionsAnswered: string;
    correctGuesses: string;
    incorrectGuesses: string;
    timePlayed: string;
    newGame: string;
    backToHome: string;
    loading: string;
    first: string;
    second: string;
    third: string;
    nth: string;
    minutes: string;
    seconds: string;
    errors: {
      failedToLoad: string;
    };
  };
}

interface GameResultsClientProps {
  dict: Dictionary;
  lang: string;
  roomCode: string;
}

export function GameResultsClient({
  dict,
  lang,
  roomCode,
}: GameResultsClientProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [results, setResults] = useState<GameResultsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Find current player in results
  const currentPlayer = results?.players.find(
    (p) => p.username === user?.username || p.userId === user?.id,
  );

  // Helper function to format placement
  const formatPlacement = (placement: number): string => {
    if (placement === 1) return dict.results.first;
    if (placement === 2) return dict.results.second;
    if (placement === 3) return dict.results.third;

    return dict.results.nth.replace("{n}", placement.toString());
  };

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${dict.results.minutes.replace("{n}", minutes.toString())} ${dict.results.seconds.replace("{n}", remainingSeconds.toString())}`;
    }

    return dict.results.seconds.replace("{n}", seconds.toString());
  };

  // Load game results on mount
  useEffect(() => {
    const loadResults = async () => {
      try {
        setIsLoading(true);

        // TODO: Replace with actual API call when backend is ready
        // const resultsData = await gameApi.getGameResults(roomCode);
        // setResults(resultsData);

        // Mock data for now (since backend is not ready)
        const mockResults: GameResultsResponse = {
          id: "mock-game-id",
          roomCode: roomCode.toUpperCase(),
          status: "completed" as GameStatus,
          characterSetId: "classic-characters",
          startedAt: new Date(Date.now() - 600000).toISOString(),
          endedAt: new Date().toISOString(),
          totalRounds: 12,
          totalDurationSeconds: 600,
          winner: {
            id: "player-1",
            username: user?.username || "Player1",
            userId: user?.id,
            isWinner: true,
            placement: 1,
            questionsAsked: 8,
            questionsAnswered: 6,
            correctGuesses: 1,
            incorrectGuesses: 0,
            totalGuesses: 1,
            timePlayedSeconds: 580,
            finalScore: 850,
          },
          players: [
            {
              id: "player-1",
              username: user?.username || "Player1",
              userId: user?.id,
              isWinner: true,
              placement: 1,
              questionsAsked: 8,
              questionsAnswered: 6,
              correctGuesses: 1,
              incorrectGuesses: 0,
              totalGuesses: 1,
              timePlayedSeconds: 580,
              finalScore: 850,
            },
            {
              id: "player-2",
              username: "Player2",
              isWinner: false,
              placement: 2,
              questionsAsked: 7,
              questionsAnswered: 8,
              correctGuesses: 0,
              incorrectGuesses: 1,
              totalGuesses: 1,
              timePlayedSeconds: 600,
              finalScore: 650,
            },
            {
              id: "player-3",
              username: "Player3",
              isWinner: false,
              placement: 3,
              questionsAsked: 5,
              questionsAnswered: 7,
              correctGuesses: 0,
              incorrectGuesses: 1,
              totalGuesses: 1,
              timePlayedSeconds: 400,
              finalScore: 450,
            },
          ],
        };

        setResults(mockResults);
      } catch (error) {
        addToast({
          color: "danger",
          title: dict.results.errors.failedToLoad,
          description: error instanceof Error ? error.message : String(error),
        });
        router.push(`/${lang}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [roomCode, user, dict, lang, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Icon
            className="mx-auto mb-4 animate-spin text-primary"
            icon="mdi:loading"
            width={48}
          />
          <p className="text-lg text-default-600">{dict.results.loading}</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const winner = results.winner;
  const isCurrentPlayerWinner = currentPlayer?.isWinner || false;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">{dict.results.title}</h1>
        <Card className="mx-auto max-w-2xl">
          <CardBody className="text-center">
            {winner && (
              <>
                <div className="mb-4">
                  <Icon
                    className="mx-auto text-warning"
                    icon="mdi:trophy"
                    width={64}
                  />
                </div>
                <h2 className="mb-2 text-2xl font-bold">
                  {dict.results.congratulations}
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <Avatar
                    name={winner.username}
                    size="lg"
                    src={winner.avatarUrl}
                  />
                  <div className="text-left">
                    <p className="text-xl font-semibold">{winner.username}</p>
                    <Chip color="success" size="sm" variant="flat">
                      {dict.results.winner}
                    </Chip>
                  </div>
                </div>
                <p className="mt-4 text-lg font-semibold text-success">
                  {dict.results.score}: {winner.finalScore}
                </p>
                {isCurrentPlayerWinner && (
                  <p className="mt-2 text-lg font-bold text-warning">
                    {dict.results.youWon}
                  </p>
                )}
                {!isCurrentPlayerWinner && currentPlayer && (
                  <p className="mt-2 text-lg text-default-600">
                    {dict.results.youLost}
                  </p>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Game Stats Section */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold">{dict.results.gameStats}</h2>
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <Icon
                  className="text-primary"
                  icon="mdi:identifier"
                  width={32}
                />
                <div>
                  <p className="text-sm text-default-600">
                    {dict.results.roomCode}
                  </p>
                  <p className="text-lg font-semibold">{results.roomCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Icon className="text-primary" icon="mdi:clock" width={32} />
                <div>
                  <p className="text-sm text-default-600">
                    {dict.results.duration}
                  </p>
                  <p className="text-lg font-semibold">
                    {formatDuration(results.totalDurationSeconds)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Icon className="text-primary" icon="mdi:counter" width={32} />
                <div>
                  <p className="text-sm text-default-600">
                    {dict.results.rounds}
                  </p>
                  <p className="text-lg font-semibold">{results.totalRounds}</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Player Stats Table */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold">{dict.results.playerStats}</h2>
        <Card>
          <CardBody>
            <Table
              aria-label="Player statistics table"
              classNames={{
                wrapper: "shadow-none",
              }}
            >
              <TableHeader>
                <TableColumn>{dict.results.placement}</TableColumn>
                <TableColumn>{dict.results.username}</TableColumn>
                <TableColumn>{dict.results.score}</TableColumn>
                <TableColumn>{dict.results.questionsAsked}</TableColumn>
                <TableColumn>{dict.results.correctGuesses}</TableColumn>
                <TableColumn>{dict.results.timePlayed}</TableColumn>
              </TableHeader>
              <TableBody>
                {results.players
                  .sort((a, b) => a.placement - b.placement)
                  .map((player) => (
                    <TableRow
                      key={player.id}
                      className={
                        player.id === currentPlayer?.id ? "bg-primary-50" : ""
                      }
                    >
                      <TableCell>
                        <Chip
                          color={player.placement === 1 ? "warning" : "default"}
                          size="sm"
                          variant="flat"
                        >
                          {formatPlacement(player.placement)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={player.username}
                            size="sm"
                            src={player.avatarUrl}
                          />
                          <span className="font-medium">{player.username}</span>
                          {player.id === currentPlayer?.id && (
                            <Chip color="primary" size="sm" variant="flat">
                              {dict.results.you}
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {player.finalScore}
                        </span>
                      </TableCell>
                      <TableCell>{player.questionsAsked}</TableCell>
                      <TableCell>
                        <span
                          className={
                            player.correctGuesses > 0
                              ? "text-success"
                              : "text-default-600"
                          }
                        >
                          {player.correctGuesses}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatDuration(player.timePlayedSeconds)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Detailed Stats Grid (Optional - can be expanded) */}
      {currentPlayer && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">
            {dict.results.detailedStats}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardBody>
                <div className="text-center">
                  <Icon
                    className="mx-auto mb-2 text-primary"
                    icon="mdi:comment-question"
                    width={32}
                  />
                  <p className="text-sm text-default-600">
                    {dict.results.questionsAsked}
                  </p>
                  <p className="text-2xl font-bold">
                    {currentPlayer.questionsAsked}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <Icon
                    className="mx-auto mb-2 text-primary"
                    icon="mdi:comment-text"
                    width={32}
                  />
                  <p className="text-sm text-default-600">
                    {dict.results.questionsAnswered}
                  </p>
                  <p className="text-2xl font-bold">
                    {currentPlayer.questionsAnswered}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <Icon
                    className="mx-auto mb-2 text-success"
                    icon="mdi:check-circle"
                    width={32}
                  />
                  <p className="text-sm text-default-600">
                    {dict.results.correctGuesses}
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {currentPlayer.correctGuesses}
                  </p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <Icon
                    className="mx-auto mb-2 text-danger"
                    icon="mdi:close-circle"
                    width={32}
                  />
                  <p className="text-sm text-default-600">
                    {dict.results.incorrectGuesses}
                  </p>
                  <p className="text-2xl font-bold text-danger">
                    {currentPlayer.incorrectGuesses}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button
          color="primary"
          size="lg"
          startContent={<Icon icon="mdi:plus-circle" width={24} />}
          onPress={() => router.push(`/${lang}/game/create`)}
        >
          {dict.results.newGame}
        </Button>
        <Button
          size="lg"
          startContent={<Icon icon="mdi:home" width={24} />}
          variant="bordered"
          onPress={() => router.push(`/${lang}`)}
        >
          {dict.results.backToHome}
        </Button>
      </div>
    </div>
  );
}
