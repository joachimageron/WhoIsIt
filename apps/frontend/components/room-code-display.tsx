"use client";

import React, { useCallback } from "react";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";

interface RoomCodeDisplayProps {
  roomCode: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  copySuccessMessage: string;
  copyErrorMessage: string;
}

export function RoomCodeDisplay({
  roomCode,
  label,
  size = "md",
  showLabel = true,
  copySuccessMessage,
  copyErrorMessage,
}: RoomCodeDisplayProps) {
  const handleCopyRoomCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      addToast({
        color: "success",
        title: copySuccessMessage,
      });
    } catch (error) {
      addToast({
        color: "danger",
        title: copyErrorMessage,
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [roomCode, copySuccessMessage, copyErrorMessage, addToast]);

  // Size-based styling
  const sizeClasses = {
    sm: {
      label: "text-xs",
      code: "text-sm",
      icon: 14,
    },
    md: {
      label: "text-small",
      code: "text-large",
      icon: 16,
    },
    lg: {
      label: "text-base",
      code: "text-xl",
      icon: 18,
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <div>
      {showLabel && label && (
        <p className={`${currentSize.label} text-default-500 mb-1`}>{label}</p>
      )}
      <button
        className={`${currentSize.code} font-semibold flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group`}
        type="button"
        onClick={handleCopyRoomCode}
      >
        {roomCode}
        <Icon
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          icon="solar:copy-bold"
          width={currentSize.icon}
        />
      </button>
    </div>
  );
}
