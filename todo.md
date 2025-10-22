# WhoIsIt - Project Analysis & Roadmap

**Last Updated:** October 2025  
**Status:** Phase 1 Complete ✅ | Phase 2 Planned 🚧 | Phase 3+ Future 📋

## 📊 Quick Summary

The WhoIsIt project is a multiplayer guessing game with a **solid foundation** in place:
- ✅ **Backend API complete**: Authentication, character sets, game lobby, and start game functionality
- ✅ **Socket.IO real-time system**: Secure WebSocket gateway with authentication and reconnection
- ✅ **CI/CD pipeline**: Automated testing and building with GitHub Actions
- 🚧 **Frontend**: Authentication pages complete, but game pages (create, join, lobby, play) not yet implemented
- 🚧 **Gameplay**: Core game mechanics (questions, answers, guessing) planned but not implemented

**Next Priority:** Implement frontend game pages and connect them to the existing backend APIs (Phase 2).

---

## 📊 État Actuel du Projet (Detailed Analysis)

### Architecture et Technologies

- **Monorepo** : PNPM workspace avec 4 packages (~8,200 lignes de code total)
- **Backend** : NestJS 11 + TypeORM + PostgreSQL (~4,700 lignes)
- **Frontend** : Next.js 15 + HeroUI + Zustand (~3,500 lignes)
- **Contracts** : Package partagé de types TypeScript pour API REST et Socket.IO
- **Stack temps réel** : Socket.IO pour synchronisation lobby et gameplay

### ✅ Fonctionnalités Implémentées

#### Backend (NestJS)

**Authentification complète :**

- ✅ Inscription utilisateur avec validation email
- ✅ Login/Logout avec cookies HTTP-only sécurisés
- ✅ Système de vérification email (envoi + validation token)
- ✅ Workflow complet "mot de passe oublié" (demande + reset)
- ✅ Re-envoi d'email de vérification
- ✅ Service email avec templates MJML via Nodemailer
- ✅ 64/65 tests unitaires passent (AuthController, AuthService, GameService)

**Gestion de jeu - Phase Lobby :**

- ✅ Création de partie (POST /games) avec room code généré
- ✅ Rejoindre une partie (POST /games/:roomCode/join)
- ✅ Récupération état lobby (GET /games/:roomCode)
- ✅ Mise à jour statut "prêt" joueur
- ✅ Gateway Socket.IO opérationnel (joinRoom, leaveRoom, updatePlayerReady)
- ✅ Broadcast temps réel des changements lobby (lobbyUpdate, playerJoined)

**Base de données :**

- ✅ 15 entités TypeORM complètes (User, Game, GamePlayer, Round, Question, Answer, Guess, Character, CharacterSet, Trait, etc.)
- ✅ Scripts de seed fonctionnels (utilisateurs, character set "Classic Characters" avec 24 personnages)
- ✅ Relations entre entités bien définies
- ✅ Support des invitations, événements de jeu, statistiques joueurs

**Configuration et tooling :**

- ✅ Variables d'environnement via ConfigModule
- ✅ CORS configuré pour frontend
- ✅ Scripts pnpm : dev, build, lint, test, seed
- ✅ ESLint + Prettier configurés

#### Frontend (Next.js)

**Pages d'authentification :**

- ✅ /auth/login - Connexion
- ✅ /auth/register - Inscription
- ✅ /auth/forgot-password - Demande reset password
- ✅ /auth/forgot-password/[reset-token] - Reset avec token
- ✅ /auth/verify-email/[verify-token] - Vérification email

**Infrastructure state management :**

- ✅ Store Zustand pour auth (useAuthStore avec user, isLoading, login, register, logout, etc.)
- ✅ Hook useAuth pour authentification
- ✅ Store Zustand pour jeu (useGameStore avec lobby, isConnected)
- ✅ Hook useGameSocket avec méthodes typées (joinRoom, leaveRoom, updatePlayerReady, onLobbyUpdate, onPlayerJoined)
- ✅ Client Socket.IO avec types complets

**Pages marketing/démo :**

- ✅ Page d'accueil (landing)
- ✅ /about, /blog, /docs, /pricing

**Configuration :**

- ✅ HeroUI intégré avec Tailwind CSS 4
- ✅ ESLint configuré
- ✅ Layout avec provider pour auth et thème

#### Contracts & Documentation

- ✅ Types partagés pour API REST (CreateGameRequest, JoinGameRequest, GameLobbyResponse, etc.)
- ✅ Types Socket.IO complets (ServerToClientEvents, ClientToServerEvents)
- ✅ Documentation complète : authentication-api.md, frontend-authentication.md, database-schema.md, SOCKETIO_FLOW.md, SOCKETIO_INTEGRATION.md
- ✅ IMPLEMENTATION_SUMMARY.md détaillé

### ❌ Fonctionnalités Manquantes / Lacunes Identifiées

#### 🎯 Gameplay Core (CRITIQUE)

- ❌ **Aucune API pour démarrer une partie** (POST /games/:roomCode/start)
- ❌ **Aucune logique de rounds** implémentée côté backend
- ❌ **Aucun système de questions/réponses** opérationnel
- ❌ **Aucun système de guesses** (deviner le personnage)
- ❌ **Aucun calcul de score/victoire**
- ❌ Les entités Round, Question, Answer, Guess existent mais ne sont jamais utilisées
- ❌ Événements Socket.IO pour le gameplay manquants (questionAsked, answerSubmitted, guessResult, roundEnded, gameOver)

#### 🎨 Interface Utilisateur de Jeu

- ❌ **Aucune page de création de partie** (sélection character set, config max players, timer)
- ❌ **Aucune page "Rejoindre"** dédiée (saisie room code)
- ❌ **Aucune page lobby** consommant useGameSocket (liste joueurs, bouton prêt, début partie)
- ❌ **Aucune page de jeu/plateau** (grille personnages, panel questions, historique, timer)
- ❌ useGameSocket et game-store créés mais jamais utilisés dans l'UI
- ❌ Aucune composant pour afficher l'état de jeu temps réel

#### 📚 API Catalogue de Personnages

- ❌ **Aucune route GET /character-sets** pour lister les sets disponibles
- ❌ **Aucune route GET /character-sets/:id** pour détails d'un set
- ❌ **Aucune route GET /character-sets/:id/characters** pour récupérer personnages + traits
- ❌ Impossible pour le frontend de permettre à l'hôte de choisir un character set lors de la création
- ❌ Les entités CharacterSet, Character, Trait existent et sont seedées, mais pas exposées via API

#### 🔒 Sécurité et Auth Avancée

- ❌ **Socket.IO non sécurisé** : aucune validation JWT/cookies sur connexions WebSocket
- ❌ Pas de middleware pour authentifier les événements Socket.IO
- ❌ Pas de gestion des invités vs utilisateurs authentifiés (tous peuvent rejoindre)
- ❌ Aucun guard sur routes frontend (n'importe qui peut accéder à /game si elle existait)
- ❌ Pas de gestion de reconnexion Socket.IO après déconnexion
- ❌ Aucun nettoyage automatique des lobbies inactifs

#### ⚙️ Configuration et Variables d'Environnement

- ❌ Incohérence dans la documentation : API_URL vs NEXT_PUBLIC_API_URL
- ❌ Pas de fichier .env.example pour le frontend
- ❌ Variables d'environnement Socket.IO non documentées (NEXT_PUBLIC_SOCKET_URL)
- ❌ Configuration email non validée en environnement de production
- ❌ Pas de validation des variables d'env au démarrage

#### 🧪 Tests et Qualité

- ❌ 1 test backend qui échoue (email.service.spec.ts - URL reset password incorrecte)
- ❌ Aucun test frontend
- ❌ Aucun test e2e
- ❌ Aucun test d'intégration Socket.IO
- ❌ Coverage de tests non mesuré
- ❌ Pas de tests pour GameGateway

#### 🚀 CI/CD et Automatisation

- ❌ **Aucune pipeline CI/CD** (pas de .github/workflows/)
- ❌ Pas de validation automatique des PRs (lint, test, build)
- ❌ Pas de déploiement automatisé
- ❌ Pas de contrôle de qualité automatique

#### 📖 Documentation et DX

- ❌ Documentation Socket.IO mentionne /lobby page qui n'existe pas
- ❌ Guides README ne reflètent pas entièrement l'état réel
- ❌ Pas de diagramme de séquence pour une partie complète
- ❌ Pas de guide de contribution
- ❌ Pas de documentation API (Swagger/OpenAPI)

#### ��️ Base de Données et Migrations

- ❌ Pas de système de migrations TypeORM (synchronize: true en dev uniquement)
- ❌ Seeds non testés en mode production
- ❌ Pas de stratégie de rollback
- ❌ Pas de backup automatique

## 🎯 Plan d'Action Recommandé (par ordre de priorité)

### Phase 1 : Fondations Solides (1-2 semaines)

**Objectif :** Corriger les bugs, sécuriser, standardiser la configuration

1. **Fixes urgents**
   - [x] Corriger le test email.service.spec.ts (URL forgot-password)
   - [x] Créer .env.example pour frontend avec toutes les variables
   - [x] Unifier API_URL → NEXT_PUBLIC_API_URL partout
   - [x] Valider configuration CORS et cookies entre front/back

2. **API Catalogue Personnages**
   - [x] Créer CharacterSetsController
   - [x] Endpoint GET /character-sets (liste tous les sets publics)
   - [x] Endpoint GET /character-sets/:id (détails + traits)
   - [x] Endpoint GET /character-sets/:id/characters (liste personnages avec traits)
   - [x] Ajouter types dans @whois-it/contracts
   - [x] Tests unitaires pour ces endpoints

3. **Sécurité Socket.IO**
   - [x] Middleware d'authentification Socket.IO (validation JWT/cookie)
   - [x] Gestion des reconnexions automatiques
   - [x] Timeout et cleanup des lobbies abandonnés
   - [x] Tests pour GameGateway

4. **CI/CD de base**
   - [x] Workflow GitHub Actions pour lint + test + build
   - [x] Protection de branche main avec checks obligatoires
   - [x] Cache pnpm pour accélérer CI

### Phase 2 : Expérience Lobby Complète (2-3 semaines)

**Objectif :** Permettre aux utilisateurs de créer, rejoindre et démarrer une partie

1. **Frontend - Création de Partie**
   - [ ] Page /game/create avec formulaire
   - [ ] Appel GET /character-sets pour afficher les options
   - [ ] Appel POST /games avec characterSetId, maxPlayers, timer
   - [ ] Redirection vers /game/lobby/[roomCode]

2. **Frontend - Rejoindre une Partie**
   - [ ] Page /game/join avec input room code
   - [ ] Validation format room code
   - [ ] Appel POST /games/:roomCode/join
   - [ ] Redirection vers /game/lobby/[roomCode]

3. **Frontend - Page Lobby**
   - [ ] Page /game/lobby/[roomCode]
   - [ ] Utilisation de useGameSocket pour connexion temps réel
   - [ ] Liste des joueurs avec statut prêt/non prêt
   - [ ] Bouton "Prêt" pour chaque joueur
   - [ ] Bouton "Démarrer" pour l'hôte (quand tous prêts)
   - [ ] Indicateur de connexion Socket.IO
   - [ ] Gestion erreurs et déconnexions

4. **Backend - Démarrage de Partie**
   - [ ] Endpoint POST /games/:roomCode/start
   - [ ] Validation que l'hôte démarre
   - [ ] Validation que tous les joueurs sont prêts
   - [ ] Initialisation du premier round
   - [ ] Attribution secrète d'un personnage à chaque joueur
   - [ ] Événement Socket.IO gameStarted
   - [ ] Transition status: lobby → in_progress

5. **Guards et Protection**
   - [x] Middleware frontend pour routes /game/* (authentifié ou invité avec session)
   - [x] Gestion des invités (stockage temporaire)
   - [x] Empêcher les accès non autorisés

### Phase 3 : Mécanique de Jeu Core (3-4 semaines)

**Objectif :** Implémenter le gameplay complet (questions, réponses, guesses, scoring)

1. **Backend - Système de Questions**
   - [ ] Endpoint POST /games/:roomCode/questions (poser une question)
   - [ ] Validation que c'est le tour du joueur
   - [ ] Enregistrement Question entity
   - [ ] Événement Socket.IO questionAsked
   - [ ] Transition du tour

2. **Backend - Système de Réponses**
   - [ ] Endpoint POST /games/:roomCode/answers (répondre à question)
   - [ ] Validation du répondeur (joueur ciblé)
   - [ ] Enregistrement Answer entity
   - [ ] Calcul de la réponse basé sur personnage secret
   - [ ] Événement Socket.IO answerSubmitted
   - [ ] Mise à jour de l'état du round

3. **Backend - Système de Guesses**
   - [ ] Endpoint POST /games/:roomCode/guesses (deviner personnage)
   - [ ] Validation du joueur qui devine
   - [ ] Vérification si correct
   - [ ] Enregistrement Guess entity
   - [ ] Événement Socket.IO guessResult (correct/incorrect)
   - [ ] Élimination du joueur si incorrect
   - [ ] Victoire si correct

4. **Backend - Système de Rounds et Scoring**
   - [ ] Avancement automatique des rounds
   - [ ] Calcul du score (temps, tentatives)
   - [ ] Détection de fin de partie (un seul joueur restant ou victoire)
   - [ ] Sauvegarde statistiques joueurs
   - [ ] Événement Socket.IO gameOver avec résultats

5. **Frontend - Interface de Jeu**
   - [ ] Page /game/play/[roomCode]
   - [ ] Grille de personnages (avec état éliminé/actif)
   - [ ] Panel de questions avec input
   - [ ] Historique des Q&A
   - [ ] Interface de guess (sélectionner personnage)
   - [ ] Timer de tour
   - [ ] Indicateur "votre tour" / "tour de X"
   - [ ] Bouton "Abandonner"

6. **Frontend - Écran de Fin de Partie**
   - [ ] Page /game/results/[roomCode]
   - [ ] Affichage du gagnant
   - [ ] Tableau des scores
   - [ ] Historique complet de la partie
   - [ ] Bouton "Nouvelle partie" / "Retour au menu"

7. **Types et Contracts**
   - [ ] Types pour Question, Answer, Guess
   - [ ] Événements Socket.IO pour gameplay
   - [ ] États de jeu complets dans game-store

### Phase 4 : Qualité et Fiabilité (2 semaines)

**Objectif :** Tester, documenter, optimiser

1. **Tests Backend**
   - [ ] Tests unitaires GameController (start, questions, answers, guesses)
   - [ ] Tests GameGateway (tous les événements)
   - [ ] Tests CharacterSetsController
   - [ ] Tests d'intégration pour workflow complet
   - [ ] Coverage minimum 80%

2. **Tests Frontend**
   - [ ] Tests composants auth
   - [ ] Tests composants game
   - [ ] Tests hooks (useGameSocket, useAuth)
   - [ ] Tests stores Zustand
   - [ ] Tests e2e Playwright pour parcours complet

3. **Documentation**
   - [ ] Documentation API avec Swagger
   - [ ] Mise à jour README avec instructions complètes
   - [ ] Diagrammes de séquence pour flows critiques
   - [ ] Guide de contribution
   - [ ] Architecture decision records (ADRs)

4. **Migrations et Production**
   - [ ] Migrations TypeORM pour schéma DB
   - [ ] Scripts de rollback
   - [ ] Configuration multi-environnements
   - [ ] Docker Compose pour dev local
   - [ ] Documentation déploiement

### Phase 5 : Fonctionnalités Avancées (2-3 semaines)

**Objectif :** Enrichir l'expérience utilisateur

1. **Gestion Avatar**
   - [ ] Upload d'avatar utilisateur
   - [ ] Intégration service stockage (S3, Cloudinary)
   - [ ] Affichage avatars dans lobby et jeu

2. **Statistiques et Historique**
   - [ ] Page profil utilisateur
   - [ ] Historique des parties
   - [ ] Statistiques (victoires, défaites, temps moyen, etc.)
   - [ ] Classement global

3. **Invitations et Parties Privées**
   - [ ] Système d'invitation par email
   - [ ] Parties privées avec mot de passe
   - [ ] Liste des amis

4. **Internationalisation**
   - [ ] i18n frontend (français, anglais)
   - [ ] Traductions backend (emails)
   - [ ] Sélection langue utilisateur

5. **Modes de Jeu Avancés**
   - [ ] Mode solo contre IA
   - [ ] Mode tournoi
   - [ ] Character sets personnalisés par utilisateur

## 📈 Métriques de Qualité Actuelles

### Tests

- Backend : 64/65 tests passent (98.5%)
- Frontend : 0 tests
- E2E : 0 tests
- **Coverage : non mesuré**

### Build

- Backend : ✅ Build réussit
- Frontend : ⚠️ Build échoue (problème Google Fonts en environnement restreint - non bloquant en dev)
- Contracts : ✅ Pas de build nécessaire

### Lint

- Backend : ✅ ESLint configuré
- Frontend : ✅ ESLint configuré
- **Status : non exécuté dans cette analyse**

## 🎓 Conclusions et Recommandations Stratégiques

### Points Forts

1. **Architecture solide** : monorepo bien structuré, séparation claire des responsabilités
2. **Authentification complète** : fonctionnalité rare et complexe déjà implémentée à 100%
3. **Base de données riche** : toutes les entités nécessaires existent
4. **Foundation Socket.IO** : infrastructure temps réel prête et typée
5. **Documentation fournie** : effort notable sur les docs techniques

### Points Faibles Critiques

1. **Aucun gameplay** : impossible de jouer réellement, juste de créer/rejoindre un lobby
2. **APIs manquantes** : character sets non exposés, pas de démarrage de partie
3. **UI de jeu inexistante** : aucune page de jeu, lobby non implémenté
4. **Sécurité Socket.IO** : vulnérable, pas d'auth sur WebSocket
5. **Pas de CI/CD** : aucune automatisation, risque de régression

### Recommandation Prioritaire

#### **Focus immédiat : Phase 1 (Fondations) + Phase 2 (Lobby)**

Le projet a une excellente base mais ne permet pas encore de jouer. La priorité absolue est :

1. Exposer les character sets via API
2. Créer les pages de création/join/lobby
3. Implémenter le démarrage de partie
4. Sécuriser Socket.IO

Une fois le lobby fonctionnel de bout en bout, l'équipe pourra itérer sur le gameplay (Phase 3) avec une base solide et testée.

### Prochaine Étape Suggérée

**Sprint 1 (1 semaine) :** Corriger le test failing + créer API character-sets + page /game/create

---

*Analyse réalisée le 22 octobre 2025*
*Projet : WhoIsIt - Jeu de devinettes multijoueur temps réel*
*Version : 0.1.0 (Pre-alpha)*
