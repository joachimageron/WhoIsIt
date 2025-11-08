"use client";

import type { CharacterResponseDto } from "@whois-it/contracts";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Icon } from "@iconify/react";
import Image from "next/image";

interface CharacterGridProps {
  characters: CharacterResponseDto[];
  eliminatedIds: Set<string>;
  flippedIds: Set<string>;
  dict: any;
  onFlipCharacter: (characterId: string) => void;
}

export function CharacterGrid({
  characters,
  eliminatedIds,
  flippedIds,
  dict,
  onFlipCharacter,
}: CharacterGridProps) {
  const activeAndFlippedCharacters = characters.filter(
    (c) => !eliminatedIds.has(c.id),
  );
  const eliminatedCharacters = characters.filter((c) =>
    eliminatedIds.has(c.id),
  );

  if (characters.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-default-400">
            {dict.play.noCharactersYet}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{dict.play.characterGrid}</h2>
      </CardHeader>
      <CardBody className="gap-4">
        {/* Active and Flipped Characters */}
        {activeAndFlippedCharacters.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-default-600">
              {dict.play.activeCharacters} ({activeAndFlippedCharacters.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
              {activeAndFlippedCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isEliminated={false}
                  isFlipped={flippedIds.has(character.id)}
                  onClick={() => onFlipCharacter(character.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Eliminated Characters */}
        {eliminatedCharacters.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-default-400">
              {dict.play.eliminatedCharacters} ({eliminatedCharacters.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
              {eliminatedCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isEliminated={true}
                  isFlipped={false}
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

interface CharacterCardProps {
  character: CharacterResponseDto;
  isEliminated: boolean;
  isFlipped: boolean;
  onClick: () => void;
}

function CharacterCard({
  character,
  isEliminated,
  isFlipped,
  onClick,
}: CharacterCardProps) {
  return (
    <button
      className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 hover:border-primary p-3 transition-all duration-300 ${
        isFlipped
          ? "scale-95 border-default-200"
          : "scale-100 border-default-300"
      } ${isEliminated ? "cursor-not-allowed" : "cursor-pointer"}`}
      disabled={isEliminated}
      type="button"
      onClick={onClick}
    >
      {isEliminated && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon
            className="text-danger"
            icon="solar:close-circle-bold"
            width={48}
          />
        </div>
      )}

      {isFlipped && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-default-100/90 transition-all duration-300 animate-in fade-in">
          <Icon
            className="text-default-600"
            icon="solar:eye-closed-bold"
            width={48}
          />
        </div>
      )}

      <Image
        alt={character.name}
        className={
          (isEliminated || isFlipped ? "opacity-20" : "opacity-100") +
          " rounded-xl transition-opacity duration-300"
        }
        height={100}
        src={character.imageUrl ?? ""}
        width={100}
      />

      <div className=" w-full ">
        <p
          className={` text-center text-sm font-medium ${
            isEliminated ? "line-through" : ""
          }`}
        >
          {character.name}
        </p>
      </div>
    </button>
  );
}
