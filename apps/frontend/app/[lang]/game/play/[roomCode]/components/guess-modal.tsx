"use client";

import type { CharacterResponseDto } from "@whois-it/contracts";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";

interface GuessModalProps {
  dict: any;
  isOpen: boolean;
  characters: CharacterResponseDto[];
  eliminatedIds: Set<string>;
  onClose: () => void;
  onGuess: (characterId: string) => Promise<void>;
}

export function GuessModal({
  dict,
  isOpen,
  characters,
  eliminatedIds,
  onClose,
  onGuess,
}: GuessModalProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [isGuessing, setIsGuessing] = useState(false);

  const activeCharacters = characters.filter((c) => !eliminatedIds.has(c.id));

  const handleGuess = async () => {
    if (!selectedCharacterId) {
      addToast({
        color: "warning",
        title: dict.play.errors.selectCharacter,
      });

      return;
    }

    setIsGuessing(true);

    try {
      await onGuess(selectedCharacterId);
      onClose();
      setSelectedCharacterId(null);
    } finally {
      setIsGuessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={() => {
        onClose();
        setSelectedCharacterId(null);
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{dict.play.guessPanel}</h2>
          <p className="text-sm font-normal text-default-500">
            {dict.play.guessDescription}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activeCharacters.map((character) => (
              <button
                key={character.id}
                className={`group relative flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                  selectedCharacterId === character.id
                    ? "border-primary bg-primary-50"
                    : "border-default-200 bg-default-100 hover:border-primary hover:bg-default-200"
                }`}
                type="button"
                onClick={() => setSelectedCharacterId(character.id)}
              >
                {selectedCharacterId === character.id && (
                  <div className="absolute right-2 top-2">
                    <Icon
                      className="text-primary"
                      icon="solar:check-circle-bold"
                      width={24}
                    />
                  </div>
                )}

                <Avatar
                  name={character.name}
                  size="lg"
                  src={character.imageUrl || undefined}
                />

                <p className="text-center text-sm font-medium">
                  {character.name}
                </p>
              </button>
            ))}
          </div>

          {activeCharacters.length === 0 && (
            <p className="text-center text-default-400">
              {dict.play.noCharactersYet}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            {dict.play.cancelGuess}
          </Button>
          <Button
            color="primary"
            isDisabled={!selectedCharacterId}
            isLoading={isGuessing}
            startContent={<Icon icon="solar:target-bold" width={20} />}
            onPress={handleGuess}
          >
            {isGuessing ? dict.play.guessing : dict.play.guessButton}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
