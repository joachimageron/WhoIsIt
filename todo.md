# Vue d’ensemble du projet

- **Backend (NestJS + TypeORM)** : Authentification quasiment complète (inscription, login, cookies HTTP-only, e-mails MJML via Nodemailer), base de données riche (toutes les entités WhoIsIt, scripts de seeds utilisateurs & sets de personnages, service de jeu couvrant la phase lobby avec Socket.IO). Tests unitaires présents pour `AuthController` et `GameService`.
- **Frontend (Next.js 15 + HeroUI + Zustand)** : Pages d’auth (login/register/forgot) opérationnelles, store Zustand pour l’état utilisateur, hook `useAuth`, intégration Socket.IO factorisée (`useGameSocket` + `game-store`). L’interface principale reste marketing/démo.
- **Partage & tooling** : Package `@whois-it/contracts` typant les requêtes lobby/socket, documentation fournie (auth front/back, schéma BDD, Socket.IO). Workspace PNPM prêt, scripts `pnpm dev`, `pnpm dev:backend`, `pnpm dev:frontend`, `pnpm seed`.

## Lacunes et points de vigilance

- **Fonctionnel jeu** : seuls la création/join lobby et le statut « prêt » sont implémentés. Aucun déroulé de partie (rounds, questions, réponses, guesses, scoring) n’est exposé côté API, ni consommé côté UI.
- **Catalogue personnages** : aucune route REST pour lister/choisir les `character_sets`, récupérer personnages/traits, essential pour configurer une partie.
- **Frontend gameplay** : pas de pages pour créer un lobby, rejoindre via code, voir la salle ou manipuler le plateau. La page `/lobby` mentionnée dans les docs n’existe plus, et aucun composant n’utilise `useGameSocket`.
- **Cohérence config** : auth-api.ts attend `process.env.API_URL` alors que la doc parle de `NEXT_PUBLIC_API_URL`. Risque d’erreur au runtime et absence de fallback pour les routes protégées.
- **Sécurité Socket.IO** : aucune authentification (JWT/cookies) n’est reliée à la connexion WebSocket ; pas de gestion d’expiration, ni de nettoyage des états côté backend hors lobby.
- **Qualité / Ops** : pas de tests e2e, pas de lint/formattage automatisés, ni de pipelines CI. La configuration mail/multienv reste à valider (transporter inactif si variables manquantes).

## Recommandations prioritaires

1. **Mise à niveau socle**
   - Unifier les variables d’environnement (exposer `NEXT_PUBLIC_API_URL`, documenter `.env.local`, vérifier CORS & cookies).
   - Ajouter des routes REST/DTOs pour `GET character-sets`, `GET characters`, `POST games/:room/start`, etc., en s’appuyant sur les entités existantes.
   - Protéger Socket.IO (auth via cookie JWT, middlewares Nest, gestion reconnexion).
2. **Expérience lobby**
   - Créer une page « Créer une partie » (sélection du set, config règles) et une page « Rejoindre » (entrée code + avatar).
   - Construire la vue lobby consommant `useGameSocket` (liste joueurs, toggles ready, host controls).
   - Assurer la synchro REST ↔ Zustand (`/games`, `/games/:roomCode` → store).
3. **Mécanique de jeu**
   - Implémenter back-end rounds/questions/réponses/guesses + événements Socket.IO (`questionAsked`, `answerSubmitted`, `guessResult`, `roundAdvanced`, etc.).
   - Définir côté contrats les payloads complets, enrichir game-store pour suivre l’état du tour et l’historique.
   - Concevoir UI plateau (grille personnages, états éliminé/actif, timeline des événements).
4. **Auth & comptes avancés**
   - Finaliser les parcours e-mail (page de vérification token, reset password UI).
   - Ajouter un guard global pour restreindre les routes de jeu aux utilisateurs authentifiés (ou gérer les invités explicitement).
   - Préparer la gestion avatar (upload/URL), préférences langue, stats.
5. **Qualité et automatisation**
   - Mettre en place lint/test CI, formatter partagé, scripts `pnpm lint`, `pnpm test` cross-workspace.

- Étendre la couverture de tests (controllers, services, hooks front).
- Vérifier la seed en mode `DB_SYNC=false` via migrations et préparer scripts de migration.

6. **Documentation & DX**
   - Aligner les guides (`README`, docs socket) avec l’état réel (chemins, commandes).
   - Ajouter un diagramme de séquence pour une partie complète et clarifier les responsabilités front/back/socket.

## Qualité (auto-vérifications)

- Build/tests : non exécutés (analyse uniquement).

## Couverture des exigences

- Analyse du projet : ✅ réalisée (backend, frontend, tooling).
- Identification des prochaines étapes : ✅ plan détaillé fourni.

Prochain focus suggéré : sécuriser les fondations (config/env, endpoints catalogue) puis attaquer l’expérience lobby complète avant de traiter la logique de partie et la montée en qualité.
