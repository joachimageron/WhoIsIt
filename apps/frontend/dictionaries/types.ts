/**
 * Type definition for i18n dictionary
 * This provides type safety for all translation keys
 */
export interface Dictionary {
  // Common translations
  common: {
    search: string;
    language: string;
    yes: string;
    no: string;
    cancel: string;
    loading: string;
    submitting: string;
    creating: string;
    updating: string;
    connecting: string;
    connected: string;
    disconnected: string;
  };

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

  // Footer
  footer: {
    poweredBy: string;
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
    play: {
      title: string;
      roomCode: string;
      roomCodeCopied: string;
      round: string;
      turn: string;
      yourTurn: string;
      playerTurn: string;
      waitingForTurn: string;
      yourCharacter: string;
      timer: string;
      connecting: string;
      loadingGame: string;
      characters: {
        characterGrid: string;
        activeCharacters: string;
        eliminatedCharacters: string;
        flippedCharacters: string;
        noCharactersYet: string;
        noCharacterSelected: string;
        selectCharacterFirst: string;
        selectCharacterToGuess: string;
        selectedCharacter: string;
      };
      questions: {
        questionsPanel: string;
        questionPlaceholder: string;
        selectPlayer: string;
        askButton: string;
        asking: string;
        history: string;
        noQuestionsYet: string;
        askedBy: string;
        to: string;
        answered: string;
        enterQuestion: string;
      };
      answers: {
        answerButton: string;
        answerQuestion: string;
        yourAnswer: string;
        optionalDetails: string;
        optionalDetailsPlaceholder: string;
        submitAnswer: string;
        submitting: string;
        cancel: string;
        yes: string;
        no: string;
        unsure: string;
        answerSubmitted: string;
      };
      guess: {
        guessPanel: string;
        guessDescription: string;
        selectCharacter: string;
        guessButton: string;
        guessing: string;
        cancelGuess: string;
        confirmGuess: string;
        confirmGuessDescription: string;
        confirmButton: string;
        correctGuess: string;
        incorrectGuess: string;
      };
      actions: {
        abandonGame: string;
        confirmAbandon: string;
      };
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
      };
    };
    results: {
      title: string;
      winner: string;
      congratulations: string;
      youWon: string;
      youLost: string;
      you: string;
      roomCode: string;
      roomCodeCopied: string;
      loading: string;
      stats: {
        gameStats: string;
        playerStats: string;
        detailedStats: string;
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
        first: string;
        second: string;
        third: string;
        nth: string;
        minutes: string;
        seconds: string;
      };
      actions: {
        newGame: string;
        backToHome: string;
        viewCharacterSet: string;
      };
      errors: {
        failedToLoad: string;
        failedToCopyRoomCode: string;
        gameNotCompleted: string;
      };
    };
  };
}
