"use client";

import type { CharacterResponseDto } from "@whois-it/contracts";
import type { Dictionary } from "@/dictionaries";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import Image from "next/image";

interface GuessModalProps {
  dict: Dictionary;
  isOpen: boolean;
  characters: CharacterResponseDto[];
  eliminatedIds: Set<string>;
  flippedIds: Set<string>;
  isGuessing: boolean;
  onClose: () => void;
  onConfirm: (characterId: string) => void;
}

export function GuessModal({
  dict,
  isOpen,
  characters,
  eliminatedIds,
  flippedIds,
  isGuessing,
  onClose,
  onConfirm,
}: GuessModalProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );

  const activeCharacters = characters.filter(
    (c) => !eliminatedIds.has(c.id) && !flippedIds.has(c.id),
  );

  const handleConfirm = () => {
    if (selectedCharacterId) {
      onConfirm(selectedCharacterId);
      setSelectedCharacterId(null);
    }
  };

  const handleClose = () => {
    setSelectedCharacterId(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="3xl" onClose={handleClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">
            {dict.game.play.guess.confirmGuess || "Confirm Your Guess"}
          </h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-default-500">
              {dict.game.play.characters.selectCharacterToGuess ||
                "Select the character you want to guess:"}
            </p>

            {/* Character Selection Grid */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {activeCharacters.map((character) => (
                <button
                  key={character.id}
                  className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 p-2 transition-all ${
                    selectedCharacterId === character.id
                      ? "border-success bg-success-50"
                      : "border-default-200 bg-default-100 hover:border-success hover:bg-success-50"
                  }`}
                  type="button"
                  onClick={() => setSelectedCharacterId(character.id)}
                >
                  {selectedCharacterId === character.id && (
                    <div className="absolute -right-1 -top-1 z-10">
                      <Icon
                        className="text-success"
                        icon="solar:check-circle-bold"
                        width={24}
                      />
                    </div>
                  )}

                  <Image
                    alt={character.name}
                    className="rounded-lg"
                    height={80}
                    src={character.imageUrl ?? ""}
                    width={80}
                  />

                  <p className="w-full text-center text-xs font-medium">
                    {character.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            isDisabled={isGuessing}
            variant="light"
            onPress={handleClose}
          >
            {dict.game.play.guess.cancelGuess || "Cancel"}
          </Button>
          <Button
            color="success"
            isDisabled={!selectedCharacterId || isGuessing}
            isLoading={isGuessing}
            startContent={
              !isGuessing && <Icon icon="solar:target-bold" width={20} />
            }
            onPress={handleConfirm}
          >
            {isGuessing
              ? dict.game.play.guess.guessing || "Guessing..."
              : dict.game.play.guess.confirmButton || "Confirm Guess"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
