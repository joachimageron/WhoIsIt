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
  const activeCharacters = characters.filter(
    (c) => !eliminatedIds.has(c.id) && !flippedIds.has(c.id),
  );
  const flippedCharacters = characters.filter((c) => flippedIds.has(c.id));
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
        {/* Active Characters */}
        {activeCharacters.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-default-600">
              {dict.play.activeCharacters} ({activeCharacters.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
              {activeCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isEliminated={false}
                  isFlipped={false}
                  onClick={() => onFlipCharacter(character.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Flipped Characters */}
        {flippedCharacters.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-default-500">
              {dict.play.flippedCharacters} ({flippedCharacters.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
              {flippedCharacters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isEliminated={false}
                  isFlipped={true}
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
      className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
        isEliminated
          ? "cursor-not-allowed border-default-200 bg-default-50 opacity-50"
          : isFlipped
            ? "cursor-pointer border-warning-300 bg-warning-50 hover:bg-warning-100"
            : "cursor-pointer border-default-200 bg-default-100 hover:border-primary hover:bg-default-200"
      }`}
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
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-warning-100/80">
          <Icon
            className="text-warning-600"
            icon="solar:eye-closed-bold"
            width={48}
          />
        </div>
      )}

      <Image
        alt={character.name}
        className={
          (isEliminated || isFlipped ? "opacity-30" : "") + " rounded-xl"
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
