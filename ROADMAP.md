# Roadmap du projet "Qui est-ce ?"

## Phase 1 – Vision & cadrage produit

- Valider le mode de jeu principal (duel en ligne 1v1) et le parcours d’inscription / connexion obligatoire.
- Concevoir l’expérience mobile-first et anticiper l’extension desktop.
- Valider le format des grilles : métadonnées, liste de personnages, chemins d’images (ajoutés plus tard), attributs décrits textuellement.
- Caler la mécanique de questions : saisie libre par les joueurs, suggestions optionnelles basées sur des tags d’attributs.
- Lister les emails nécessaires (vérification, bienvenue, rappel) et cadrer leur envoi via le SMTP maison.
- Noter la future option « spectateurs » et l’historique des parties sur tableau de bord comme évolutions secondaires.

## Phase 2 – Schémas de données & gestion des grilles

- Définir un schéma TypeScript partagé (`packages/game-data`) pour `Grid`, `Character`, `Attribute`, `SuggestedQuestion`.
- Stocker les grilles dans des modules JSON/TS versionnés ; prévoir un registre exportant la liste disponible et facilitant l’ajout d’une nouvelle grille.
- Concevoir le modèle Postgres correspondant (tables `grids`, `characters`, `attributes`, `grid_attributes`) et un script de seed synchronisant fichiers et base.
- Ajouter une validation automatique (tests unitaires ou script `pnpm data:check`) pour garantir l’unicité des IDs et la cohérence des attributs.
- Introduire des scripts `pnpm data:seed` et `pnpm data:list` (optionnel) exposés depuis la racine pour synchroniser et auditer les données.
- Documenter dans `docs/phase-2-vision.md` le flux d’ajout d’une grille et référencer les prérequis (Postgres, Prisma, Zod).

## Phase 3 – Backend fondations (NestJS + Postgres)

- Brancher Postgres via Prisma ou TypeORM ; configurer migrations pour `users`, `grids`, `characters`, `attributes`, `game_session`, `question`, `chat_message`.
- Implémenter `GridsModule` (REST `GET /grids`, `GET /grids/:id`) lisant depuis Postgres.
- Mettre en place `GameSessionsModule` pour créer/rejoindre une partie, attribuer un personnage secret, gérer l’état serveur.
- Installer et configurer Socket.IO (via `@nestjs/websockets`) pour le chat, les questions et la diffusion d’état (`joinRoom`, `chatMessage`, `questionAsked`, `answerProvided`, `stateSync`).

## Phase 4 – Authentification & emails

- Créer `AuthModule` avec création de compte email / mot de passe, connexion et refresh tokens (ex. JWT).
- Ajouter la vérification d’email : génération d’un token stocké en base, endpoint de validation.
- Structurer les templates MJML (`apps/backend/src/mail/templates/*.mjml`), ajouter un pipeline de compilation (CLI `mjml` ou package npm) vers HTML avant envoi.
- Configurer l’envoi d’emails via le SMTP maison en injectant les templates MJML compilés.
- Prévoir des tests unitaires pour les flux d’inscription et de vérification.

## Phase 5 – Frontend gameplay avec Zustand

- Créer un store Zustand (`apps/frontend/store/game-store.ts`) gérant : session utilisateur, grille sélectionnée, état des cartes, historique questions/réponses, statut de vérification email.
- Construire un sélecteur de grilles (page d’accueil) basé sur l’API `GET /grids`.
- Réaliser la grille visuelle : cartes avec nom + placeholder d’image, toggle pour marquer « éliminé ».
- Mettre en place le panneau des questions : zone de saisie libre, suggestions cliquables générées à partir des tags fournis par l’API.

## Phase 6 – Chat et synchronisation temps réel

- Connecter le frontend au WebSocket du backend (Socket.IO client) ; propager les événements dans le store Zustand.
- Gérer la logique d’état partagé : quand un joueur élimine une carte ou répond, envoyer l’événement et mettre à jour toutes les vues.
- Implémenter le chat en temps réel, distinct du flux « questions officielles » si souhaité (onglets ou panneaux séparés).
- Assurer une résilience minimale : resynchronisation de l’état lors d’une reconnexion (`stateSync`), stockage Postgres pour conserver l’historique si besoin.
- Aucune modération automatique n’est prévue côté chat/questions dans le MVP : documenter les limites et prévoir un monitoring léger.

## Phase 7 – Tests et validation

- Backend : tests unitaires pour auth, vérification d’email, création de session, règles de jeu ; tests e2e Nest (`supertest`) couvrant inscription, login, création de partie, question/réponse.
- Frontend : tests React pour le store Zustand (logique de filtrage), tests e2e avec Playwright/Cypress simulant deux joueurs (chat + questions).
- Vérification manuelle : flux d’inscription (email reçu MJML → HTML correct), sélection de grille, déroulement complet d’une partie.

## Phase 8 – Livraison & suivi

- Documenter dans `README.md` l’ajout d’une grille (mise à jour des fichiers + exécution des scripts de seed / validation).
- Fournir un guide ops : variables d’environnement (DB, SMTP), commandes (`pnpm db:migrate`, `pnpm dev`).
- Déployer : backend Nest + Postgres (Render, Fly.io, Railway) et frontend Next (Vercel). Configurer les variables pour l’URL API et WebSocket.
- Mettre en place une supervision légère (logs auth/chat, table `email_log` si nécessaire) et prévoir une stratégie de sauvegarde Postgres basique.
- Cadrer le tableau de bord utilisateur (consultation des parties) comme itération post-MVP, en listant les données et métriques attendues.

## Compléments utiles

- Ajouter un outil interne (page admin simple) pour créer / éditer une grille dans Postgres et régénérer les fichiers data.
- Prévoir un script pour compiler les MJML en HTML pendant le CI afin de détecter les erreurs de template.
- Mettre en cache applicatif côté backend (mémoïsation simple) pour les grilles statiques afin d’éviter des requêtes répétées.
- Étendre plus tard avec des notifications email d’invitation à une partie.
