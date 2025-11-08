/**
 * Type definition for i18n dictionary
 * This provides type safety for all translation keys
 */
export interface Dictionary {
  // Navigation
  nav: {
    home: string;
    createGame: string;
    joinGame: string;
    login: string;
    signUp: string;
    settings: string;
    profile: string;
    logout: string;
  };

  // Home page
  home: {
    title1: string;
    title2: string;
    title3: string;
    subtitle: string;
    createGameButton: string;
    joinGameButton: string;
    howToPlay: string;
  };

  // About page
  about: {
    title: string;
  };

  // Authentication
  auth: {
    signedInAs: string;
    logOut: string;
    profile: {
      title: string;
      username: string;
      usernamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      avatarUrl: string;
      avatarUrlPlaceholder: string;
      currentPassword: string;
      currentPasswordPlaceholder: string;
      newPassword: string;
      newPasswordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      updateProfile: string;
      changePassword: string;
      updating: string;
      changing: string;
      updateSuccess: string;
      passwordChangeSuccess: string;
      updateFailed: string;
      passwordChangeFailed: string;
      invalidEmail: string;
      invalidUsername: string;
      invalidAvatarUrl: string;
      passwordsNoMatch: string;
      passwordTooShort: string;
      fillAllFields: string;
      emailVerificationRequired: string;
      emailVerified: string;
      emailNotVerified: string;
      resendVerification: string;
      resendingVerification: string;
      verificationEmailSent: string;
      verificationEmailFailed: string;
    };
    login: {
      title: string;
      emailOrUsername: string;
      emailOrUsernamePlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      forgotPassword: string;
      loginButton: string;
      noAccount: string;
      fillAllFields: string;
      invalidEmail: string;
      loginFailed: string;
    };
    register: {
      title: string;
      username: string;
      usernamePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      agreeToTerms: string;
      signUpButton: string;
      haveAccount: string;
      fillAllFields: string;
      invalidEmail: string;
      passwordsNoMatch: string;
      agreeToTermsError: string;
      registrationFailed: string;
      verificationSent: string;
      verificationMessage: string;
      resendVerification: string;
      emailResent: string;
    };
    forgotPassword: {
      title: string;
      description: string;
      email: string;
      emailPlaceholder: string;
      sendButton: string;
      backToLogin: string;
      enterEmail: string;
      resetLinkSent: string;
      resetLinkDescription: string;
      sendFailed: string;
    };
    resetPassword: {
      title: string;
      newPassword: string;
      newPasswordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      resetButton: string;
      passwordsNoMatch: string;
      resetSuccess: string;
      resetSuccessMessage: string;
      backToLogin: string;
      resetFailed: string;
    };
    verifyEmail: {
      verifying: string;
      success: string;
      successMessage: string;
      failed: string;
      failedMessage: string;
      goToLogin: string;
    };
  };

  // Footer
  footer: {
    poweredBy: string;
  };

  // Common/shared translations
  common: {
    search: string;
    language: string;
  };

  // Game management
  game: {
    create: {
      title: string;
      characterSet: string;
      characterSetPlaceholder: string;
      maxPlayers: string;
      maxPlayersPlaceholder: string;
      turnTimer: string;
      turnTimerPlaceholder: string;
      createButton: string;
      creating: string;
      loadingCharacterSets: string;
      fillCharacterSet: string;
      creationFailed: string;
      noCharacterSets: string;
    };
    join: {
      title: string;
      roomCode: string;
      roomCodePlaceholder: string;
      joinButton: string;
      backToHome: string;
      enterRoomCode: string;
      invalidRoomCode: string;
      joinFailed: string;
      joining: string;
    };
  };

  // Lobby
  lobby: {
    title: string;
    roomCode: string;
    copyRoomCode: string;
    roomCodeCopied: string;
    host: string;
    players: string;
    waitingForPlayers: string;
    readyStatus: string;
    notReadyStatus: string;
    toggleReady: string;
    toggleNotReady: string;
    startGame: string;
    leaveLobby: string;
    connected: string;
    disconnected: string;
    connecting: string;
    allPlayersReady: string;
    notAllPlayersReady: string;
    waitingForHost: string;
    gameStarting: string;
    redirectingToGame: string;
    errors: {
      failedToJoin: string;
      failedToUpdateReady: string;
      failedToStartGame: string;
      failedToCopyRoomCode: string;
      disconnected: string;
      roomNotFound: string;
    };
  };

  // Gameplay
  play: {
    title: string;
    roomCode: string;
    roomCodeCopied: string;
    round: string;
    turn: string;
    yourTurn: string;
    playerTurn: string;
    waitingForTurn: string;
    characterGrid: string;
    activeCharacters: string;
    eliminatedCharacters: string;
    noCharactersYet: string;
    questionsPanel: string;
    questionPlaceholder: string;
    selectPlayer: string;
    askButton: string;
    asking: string;
    answerButton: string;
    history: string;
    noQuestionsYet: string;
    askedBy: string;
    to: string;
    answered: string;
    guessPanel: string;
    guessDescription: string;
    selectCharacter: string;
    guessButton: string;
    guessing: string;
    cancelGuess: string;
    timer: string;
    abandonGame: string;
    confirmAbandon: string;
    yes: string;
    no: string;
    unsure: string;
    connecting: string;
    loadingGame: string;
    yourCharacter: string;
    confirmGuess: string;
    confirmGuessDescription: string;
    confirmButton: string;
    noCharacterSelected: string;
    selectCharacterFirst: string;
    correctGuess: string;
    incorrectGuess: string;
    answerSubmitted: string;
    answerQuestion: string;
    yourAnswer: string;
    optionalDetails: string;
    optionalDetailsPlaceholder: string;
    submitAnswer: string;
    submitting: string;
    cancel: string;
    gameOver: string;
    errors: {
      failedToLoad: string;
      failedToAskQuestion: string;
      failedToGuess: string;
      failedToAnswer: string;
      failedToCopyRoomCode: string;
      notYourTurn: string;
      selectCharacter: string;
      selectCharacterDescription: string;
      enterQuestion: string;
    };
    flippedCharacters: string;
    selectCharacterToGuess: string;
    selectedCharacter: string;
  };

  // Game results
  results: {
    title: string;
    winner: string;
    congratulations: string;
    youWon: string;
    youLost: string;
    gameStats: string;
    playerStats: string;
    detailedStats: string;
    you: string;
    roomCode: string;
    roomCodeCopied: string;
    duration: string;
    rounds: string;
    placement: string;
    username: string;
    score: string;
    questionsAsked: string;
    questionsAnswered: string;
    correctGuesses: string;
    incorrectGuesses: string;
    totalGuesses: string;
    timePlayed: string;
    newGame: string;
    backToHome: string;
    viewCharacterSet: string;
    loading: string;
    first: string;
    second: string;
    third: string;
    nth: string;
    minutes: string;
    seconds: string;
    errors: {
      failedToLoad: string;
      failedToCopyRoomCode: string;
      gameNotCompleted: string;
    };
  };
}
