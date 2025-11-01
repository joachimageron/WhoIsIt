"use client";

import type { CharacterResponseDto } from "@whois-it/contracts";

import React from "react";
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

interface GuessModalProps {
  dict: any;
  isOpen: boolean;
  selectedCharacter: CharacterResponseDto | null;
  isGuessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function GuessModal({
  dict,
  isOpen,
  selectedCharacter,
  isGuessing,
  onClose,
  onConfirm,
}: GuessModalProps) {
  return (
    <Modal isOpen={isOpen} size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">
            {dict.play.confirmGuess || "Confirm Your Guess"}
          </h2>
        </ModalHeader>
        <ModalBody>
          {selectedCharacter ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-default-500">
                {dict.play.confirmGuessDescription ||
                  "Are you sure you want to guess this character?"}
              </p>  

              <div className="flex items-center gap-3">
                <Avatar
                  name={selectedCharacter.name}
                  size="lg"
                  src={selectedCharacter.imageUrl || undefined}
                />
                <p className="text-lg font-semibold">
                  {selectedCharacter.name}
                </p>

              </div>
            </div>
          ) : (
            <p className="text-center text-default-400">
              {dict.play.noCharacterSelected || "No character selected"}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            isDisabled={isGuessing}
            variant="light"
            onPress={onClose}
          >
            {dict.play.cancelGuess || "Cancel"}
          </Button>
          <Button
            color="success"
            isDisabled={!selectedCharacter || isGuessing}
            isLoading={isGuessing}
            startContent={
              !isGuessing && <Icon icon="solar:target-bold" width={20} />
            }
            onPress={onConfirm}
          >
            {isGuessing
              ? dict.play.guessing || "Guessing..."
              : dict.play.confirmButton || "Confirm Guess"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
