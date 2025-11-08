"use client";

import type { Dictionary } from "@/dictionaries";

import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Icon } from "@iconify/react";

interface TurnTimerProps {
  dict: Dictionary;
  turnTimerSeconds: number | null;
  isMyTurn: boolean;
}

export function TurnTimer({
  dict,
  turnTimerSeconds,
  isMyTurn,
}: TurnTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    turnTimerSeconds,
  );

  useEffect(() => {
    // Reset timer when turn changes or timer value changes
    setRemainingSeconds(turnTimerSeconds);
  }, [turnTimerSeconds, isMyTurn]);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 0) {
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  // Don't show timer if not configured
  if (turnTimerSeconds === null || turnTimerSeconds === undefined) {
    return null;
  }

  const percentage =
    remainingSeconds !== null && turnTimerSeconds > 0
      ? (remainingSeconds / turnTimerSeconds) * 100
      : 0;

  const isLowTime = remainingSeconds !== null && remainingSeconds <= 10;
  const isVeryLowTime = remainingSeconds !== null && remainingSeconds <= 5;

  return (
    <Card>
      <CardBody className="gap-2 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              className={
                isVeryLowTime
                  ? "text-danger"
                  : isLowTime
                    ? "text-warning"
                    : "text-default-500"
              }
              icon="solar:clock-circle-bold"
              width={20}
            />
            <span className="text-sm font-medium">{dict.play.timer}</span>
          </div>
          <span
            className={`text-lg font-bold ${
              isVeryLowTime
                ? "text-danger"
                : isLowTime
                  ? "text-warning"
                  : "text-default-700"
            }`}
          >
            {remainingSeconds !== null ? `${remainingSeconds}s` : "—"}
          </span>
        </div>
        <Progress
          aria-label="Turn timer"
          color={isVeryLowTime ? "danger" : isLowTime ? "warning" : "primary"}
          size="sm"
          value={percentage}
        />
      </CardBody>
    </Card>
  );
}
