"use client";

import type { Dictionary } from "@/dictionaries";

import React, { useEffect } from "react";
import { Card } from "@heroui/card";
import { Icon } from "@iconify/react";

import * as authApi from "@/lib/auth-api";

interface GameStatsProps {
  dict: Dictionary;
}

export function GameStats({ dict }: GameStatsProps) {
  const [stats, setStats] = React.useState<authApi.PlayerStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const playerStats = await authApi.getPlayerStats();

        setStats(playerStats);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {dict.auth.profile.gameStats}
        </h2>
        <div className="flex justify-center items-center py-8">
          <Icon className="animate-spin text-4xl" icon="solar:loader-bold" />
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {dict.auth.profile.gameStats}
        </h2>
        <p className="text-default-500">{error || "Failed to load stats"}</p>
      </Card>
    );
  }

  const hasPlayedGames = stats.gamesPlayed > 0;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        {dict.auth.profile.gameStats}
      </h2>

      {!hasPlayedGames ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Icon
            className="text-6xl text-default-300 mb-4"
            icon="solar:gamepad-old-linear"
          />
          <p className="text-default-500">{dict.auth.profile.noStatsYet}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Games Played */}
          <div className="flex flex-col items-center p-4 bg-default-100 rounded-lg">
            <Icon
              className="text-3xl text-primary mb-2"
              icon="solar:gamepad-bold"
            />
            <span className="text-2xl font-bold">{stats.gamesPlayed}</span>
            <span className="text-sm text-default-500">
              {dict.auth.profile.gamesPlayed}
            </span>
          </div>

          {/* Games Won */}
          <div className="flex flex-col items-center p-4 bg-default-100 rounded-lg">
            <Icon
              className="text-3xl text-success mb-2"
              icon="solar:cup-star-bold"
            />
            <span className="text-2xl font-bold">{stats.gamesWon}</span>
            <span className="text-sm text-default-500">
              {dict.auth.profile.gamesWon}
            </span>
          </div>

          {/* Win Rate */}
          <div className="flex flex-col items-center p-4 bg-default-100 rounded-lg">
            <Icon
              className="text-3xl text-warning mb-2"
              icon="solar:chart-2-bold"
            />
            <span className="text-2xl font-bold">{stats.winRate}%</span>
            <span className="text-sm text-default-500">
              {dict.auth.profile.winRate}
            </span>
          </div>

          {/* Questions Asked */}
          <div className="flex flex-col items-center p-4 bg-default-100 rounded-lg">
            <Icon
              className="text-3xl text-secondary mb-2"
              icon="solar:question-circle-bold"
            />
            <span className="text-2xl font-bold">{stats.totalQuestions}</span>
            <span className="text-sm text-default-500">
              {dict.auth.profile.totalQuestions}
            </span>
          </div>

          {/* Guess Attempts */}
          <div className="flex flex-col items-center p-4 bg-default-100 rounded-lg">
            <Icon
              className="text-3xl text-danger mb-2"
              icon="solar:lightbulb-bolt-bold"
            />
            <span className="text-2xl font-bold">{stats.totalGuesses}</span>
            <span className="text-sm text-default-500">
              {dict.auth.profile.totalGuesses}
            </span>
          </div>

          {/* Fastest Win */}
          {stats.fastestWinSeconds && (
            <div className="flex flex-col items-center p-4 bg-default-100 rounded-lg">
              <Icon
                className="text-3xl text-primary mb-2"
                icon="solar:stopwatch-bold"
              />
              <span className="text-2xl font-bold">
                {stats.fastestWinSeconds}
              </span>
              <span className="text-sm text-default-500">
                {dict.auth.profile.fastestWin} ({dict.auth.profile.seconds})
              </span>
            </div>
          )}

          {/* Current Streak */}
          {stats.streak > 0 && (
            <div className="flex flex-col items-center p-4 bg-default-100 rounded-lg">
              <Icon
                className="text-3xl text-success mb-2"
                icon="solar:fire-bold"
              />
              <span className="text-2xl font-bold">{stats.streak}</span>
              <span className="text-sm text-default-500">
                {dict.auth.profile.currentStreak} ({dict.auth.profile.wins})
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
