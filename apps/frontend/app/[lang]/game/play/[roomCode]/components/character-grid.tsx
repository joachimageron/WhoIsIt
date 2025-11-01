"use client";

import type { CharacterResponseDto } from "@whois-it/contracts";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Icon } from "@iconify/react";
import Image from "next/image";

interface CharacterGridProps {
  characters: CharacterResponseDto[];
  eliminatedIds: Set<string>;
  dict: any;
}

export function CharacterGrid({
  characters,
  eliminatedIds,
  dict,
}: CharacterGridProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );

  const activeCharacters = characters.filter((c) => !eliminatedIds.has(c.id));
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
                  isSelected={selectedCharacterId === character.id}
                  onClick={() =>
                    setSelectedCharacterId(
                      selectedCharacterId === character.id
                        ? null
                        : character.id,
                    )
                  }
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
                  isSelected={false}
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
  isSelected: boolean;
  onClick: () => void;
}

function CharacterCard({
  character,
  isEliminated,
  isSelected,
  onClick,
}: CharacterCardProps) {
  return (
    <button
      className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
        isEliminated
          ? "cursor-not-allowed border-default-200 bg-default-50 opacity-50"
          : isSelected
            ? "border-primary bg-default-100 hover:bg-default-200"
            : "border-default-200 bg-default-100 hover:bg-default-200"
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

      <Image
        className={isEliminated ? "opacity-30" : "" + " rounded-xl"}
        src={character.imageUrl ?? ""}
        width={100}
        height={100}
        alt={character.name}
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
