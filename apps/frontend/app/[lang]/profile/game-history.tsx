"use client";

import type { Dictionary } from "@/dictionaries";

import React, { useEffect } from "react";
import { Card } from "@heroui/card";
import { Icon } from "@iconify/react";
import { Button } from "@heroui/button";

import * as authApi from "@/lib/auth-api";

interface GameHistoryProps {
  dict: Dictionary;
}

export function GameHistory({ dict }: GameHistoryProps) {
  const [history, setHistory] =
    React.useState<authApi.GameHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const gameHistory = await authApi.getGameHistory(10, 0);

        setHistory(gameHistory);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load game history",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs}s`;
    }

    return `${mins}${dict.auth.profile.minute}${mins > 1 ? "s" : ""} ${secs}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {dict.auth.profile.gameHistory}
        </h2>
        <div className="flex justify-center items-center py-8">
          <Icon className="animate-spin text-4xl" icon="solar:loader-bold" />
        </div>
      </Card>
    );
  }

  if (error || !history) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {dict.auth.profile.gameHistory}
        </h2>
        <p className="text-default-500">
          {error || "Failed to load game history"}
        </p>
      </Card>
    );
  }

  const hasGames = history.games.length > 0;
  const gamesToShow = showAll ? history.games : history.games.slice(0, 5);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        {dict.auth.profile.gameHistory}
      </h2>

      {!hasGames ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Icon
            className="text-6xl text-default-300 mb-4"
            icon="solar:history-linear"
          />
          <p className="text-default-500">{dict.auth.profile.noGamesYet}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gamesToShow.map((game) => (
            <div
              key={game.gameId}
              className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-default-100 rounded-lg gap-3"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    game.isWinner ? "bg-success-100" : "bg-default-200"
                  }`}
                >
                  <Icon
                    className={`text-2xl ${
                      game.isWinner ? "text-success" : "text-default-500"
                    }`}
                    icon={
                      game.isWinner
                        ? "solar:cup-star-bold"
                        : "solar:shield-cross-bold"
                    }
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {game.isWinner
                        ? dict.auth.profile.victory
                        : dict.auth.profile.defeat}
                    </span>
                    <span className="text-sm text-default-500">
                      {dict.auth.profile.placement} #{game.placement}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-default-500">
                    <span>vs {game.opponentUsername || "Unknown"}</span>
                    <span>•</span>
                    <span>{game.characterSetName}</span>
                    <span>•</span>
                    <span>{formatDate(game.endedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-lg">{game.score}</span>
                  <span className="text-default-500 text-xs">Score</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold">{game.questionsAsked}</span>
                  <span className="text-default-500 text-xs">
                    {dict.auth.profile.questions}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold">
                    {game.correctGuesses}/
                    {game.correctGuesses + game.incorrectGuesses}
                  </span>
                  <span className="text-default-500 text-xs">
                    {dict.auth.profile.guesses}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold">
                    {formatDuration(game.durationSeconds)}
                  </span>
                  <span className="text-default-500 text-xs">
                    {dict.auth.profile.duration}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {history.games.length > 5 && (
            <div className="flex justify-center pt-2">
              <Button
                size="sm"
                variant="flat"
                onPress={() => setShowAll(!showAll)}
              >
                {showAll
                  ? dict.auth.profile.showLess
                  : dict.auth.profile.showMore}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
