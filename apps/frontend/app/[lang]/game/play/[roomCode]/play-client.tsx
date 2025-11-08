"use client";

import type { Dictionary } from "@/dictionaries";

import React from "react";
import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

import { CharacterGrid } from "./components/character-grid";
import { QuestionsPanel } from "./components/questions-panel";
import { QuestionHistory } from "./components/question-history";
import { GameHeader } from "./components/game-header";
import { GuessModal } from "./components/guess-modal";
import { TurnTimer } from "./components/turn-timer";
import { AnswerModal } from "./components/answer-modal";

import { useGameStore } from "@/store/game-store";
import { useGameInitialization } from "@/hooks/use-game-initialization";
import { useGameEvents } from "@/hooks/use-game-events";
import { useGameActions } from "@/hooks/use-game-actions";

interface GamePlayClientProps {
  dict: Dictionary;
  lang: string;
  roomCode: string;
}

export function GamePlayClient({ dict, lang, roomCode }: GamePlayClientProps) {
  const { playState, isConnected, toggleFlipCharacter } = useGameStore();

  // Initialize game and load all necessary data
  const { isLoading, currentPlayerId, lobby } = useGameInitialization({
    roomCode,
    lang,
    dict,
  });

  // Set up socket event listeners
  const {
    pendingQuestion,
    setPendingQuestion,
    isAnswerModalOpen,
    setIsAnswerModalOpen,
  } = useGameEvents({
    currentPlayerId,
    roomCode,
    lang,
    dict,
  });

  // Set up game action handlers
  const {
    isGuessModalOpen,
    setIsGuessModalOpen,
    isGuessing,
    handleLeaveGame,
    handleOpenGuessModal,
    handleConfirmGuess,
    handleSubmitAnswer,
  } = useGameActions({
    roomCode,
    currentPlayerId,
    lang,
    dict,
    setPendingQuestion,
    setIsAnswerModalOpen,
  });

  if (isLoading || !playState || !playState.gameState) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Icon
            className="animate-spin text-primary"
            icon="solar:loader-linear"
            width={48}
          />
          <p className="text-lg">{dict.game.play.loadingGame}</p>
        </div>
      </div>
    );
  }

  const { gameState, characters, questions, myCharacter } = playState;
  const isMyTurn = gameState.activePlayerId === currentPlayerId;

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <GameHeader
        dict={dict}
        gameState={gameState}
        isConnected={isConnected}
        isMyTurn={isMyTurn}
        questionCount={questions.length}
        roomCode={roomCode}
        onLeaveGame={handleLeaveGame}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Character Grid - Left/Top */}
        <div className="lg:col-span-2">
          <CharacterGrid
            characters={characters}
            dict={dict}
            eliminatedIds={playState.eliminatedCharacterIds}
            flippedIds={playState.flippedCharacterIds}
            onFlipCharacter={toggleFlipCharacter}
          />
        </div>

        {/* Right Panel - Questions, Timer, and History */}
        <div className="flex flex-col gap-4">
          {/* Turn Timer */}
          {lobby?.turnTimerSeconds && (
            <TurnTimer
              dict={dict}
              isMyTurn={isMyTurn}
              turnTimerSeconds={lobby.turnTimerSeconds}
            />
          )}

          {/* My Character Card */}
          {myCharacter && (
            <Card>
              <CardBody className="p-3">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Icon
                      className="text-primary"
                      icon="solar:user-id-bold"
                      width={20}
                    />
                    <h3 className="text-sm font-semibold">
                      {dict.game.play.yourCharacter || "Your Character"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-content2 p-3">
                    {myCharacter.character.imageUrl && (
                      <Image
                        alt={myCharacter.character.name}
                        className="h-16 w-16 rounded-lg object-cover"
                        height={64}
                        src={myCharacter.character.imageUrl}
                        width={64}
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-primary">
                        {myCharacter.character.name}
                      </p>
                      {myCharacter.character.summary && (
                        <p className="text-xs text-foreground-500">
                          {myCharacter.character.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Make a Guess Button */}
          <Card>
            <CardBody className="p-3">
              <Button
                fullWidth
                color="success"
                isDisabled={!isMyTurn}
                startContent={<Icon icon="solar:target-bold" width={20} />}
                variant="shadow"
                onPress={handleOpenGuessModal}
              >
                {dict.game.play.guess.guessPanel}
              </Button>
            </CardBody>
          </Card>

          {/* Questions Panel */}
          <QuestionsPanel
            currentPlayerId={currentPlayerId}
            dict={dict}
            gameState={gameState}
            isMyTurn={isMyTurn}
            roomCode={roomCode}
          />

          {/* Question History */}
          <QuestionHistory
            answers={playState.answers}
            currentPlayerId={currentPlayerId}
            dict={dict}
            questions={questions}
            onAnswerQuestion={(question) => {
              setPendingQuestion(question);
              setIsAnswerModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Guess Confirmation Modal */}
      <GuessModal
        characters={characters}
        dict={dict}
        eliminatedIds={playState.eliminatedCharacterIds}
        flippedIds={playState.flippedCharacterIds}
        isGuessing={isGuessing}
        isOpen={isGuessModalOpen}
        onClose={() => setIsGuessModalOpen(false)}
        onConfirm={handleConfirmGuess}
      />

      {/* Answer Modal */}
      <AnswerModal
        dict={dict}
        isOpen={isAnswerModalOpen}
        question={pendingQuestion}
        onClose={() => {
          setIsAnswerModalOpen(false);
          setPendingQuestion(null);
        }}
        onSubmitAnswer={handleSubmitAnswer}
      />
    </div>
  );
}
