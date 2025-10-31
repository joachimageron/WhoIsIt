export enum GameStatus {
  LOBBY = 'lobby',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
}

export enum GameVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum GamePlayerRole {
  HOST = 'host',
  PLAYER = 'player',
  SPECTATOR = 'spectator',
}

export enum PlayerSecretStatus {
  HIDDEN = 'hidden',
  REVEALED = 'revealed',
}

export enum RoundState {
  AWAITING_QUESTION = 'awaiting_question',
  AWAITING_ANSWER = 'awaiting_answer',
  AWAITING_GUESS = 'awaiting_guess',
  CLOSED = 'closed',
}

export enum QuestionCategory {
  DIRECT = 'direct',
  META = 'meta',
}

export enum AnswerValue {
  YES = 'yes',
  NO = 'no',
  UNSURE = 'unsure',
}

export enum GameEventType {
  PLAYER_JOINED = 'player_joined',
  PLAYER_READY = 'player_ready',
  QUESTION_ASKED = 'question_asked',
  ANSWER_SUBMITTED = 'answer_submitted',
  CHARACTER_ELIMINATED = 'character_eliminated',
  GUESS_MADE = 'guess_made',
  TIMER_EXPIRED = 'timer_expired',
  GAME_STATE_CHANGED = 'game_state_changed',
}

export enum PlayerPanelStatus {
  UNKNOWN = 'unknown',
  ELIMINATED = 'eliminated',
  HIGHLIGHTED = 'highlighted',
}
