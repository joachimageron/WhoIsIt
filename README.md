# WhoIsIt Monorepo

Monorepo template for the WhoIsIt guessing game featuring a mobile-first Next.js frontend styled with [HeroUI](https://www.heroui.dev), real-time updates through Socket.IO, and a NestJS backend with PostgreSQL persistence.

## Project structure

```text
.
├─ apps/
│  ├─ frontend/    # Next.js + HeroUI client, includes Zustand store and Socket.IO client runtime deps
│  └─ backend/     # NestJS API/WebSocket server configured for PostgreSQL via TypeORM
├─ packages/       # Reserved for future shared libraries
├─ package.json    # Workspace orchestration scripts
├─ pnpm-lock.yaml
└─ pnpm-workspace.yaml
```

## Getting started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure backend environment**

   Duplicate `apps/backend/.env.example` to `.env` and adjust values for your PostgreSQL instance.

   ```bash
   copy apps\backend\.env.example apps\backend\.env
   ```

3. **Run the apps in development**

   ```bash
   pnpm dev
   ```

   - Frontend only: `pnpm dev:frontend`
   - Backend only: `pnpm dev:backend`

## Tooling highlights

- **Frontend**: Next.js 15 with Turbopack, Tailwind CSS 4, HeroUI component suite, Zustand state management, and Socket.IO client.
- **Backend**: NestJS 11 with ConfigModule, TypeORM auto-loading entities, Socket.IO gateway support, and PostgreSQL driver.
- **Package manager**: pnpm workspaces with shared hoisting configured for HeroUI packages.

## Phase 1 summary

The initial product vision is documented in [`docs/phase-1-vision.md`](docs/phase-1-vision.md). Key decisions:

- MVP focuses on **duel 1v1 en ligne** avec chat temps réel, sans mode solo.
- UX conçue **mobile-first** avec extension desktop en second temps.
- Grilles de personnages configurables (données versionnées + seed Postgres) sans design d’avatars imposé.
- Authentification obligatoire, emails (vérification, bienvenue, rappel) envoyés via **SMTP maison** avec templates MJML.
- Pas de modération automatique du chat dans le MVP, mais historique des parties conservé côté serveur.
- Tableau de bord utilisateur pour consulter les parties : prévu comme évolution post-MVP.

## Next steps

- **Phase 2 – Données & grilles** : schéma TS partagé, seed Postgres et validations automatiques.
- **Phase 3 – Backend** : modules grilles & sessions, Socket.IO, persistance des questions/chat.
- **Phase 4 – Auth & emails** : comptes email/mot de passe, vérification via SMTP maison, templates MJML.
- **Phase 5 – Frontend** : store Zustand, sélecteur de grille, UI mobile-first de la grille.
- **Phase 6 – Temps réel** : synchronisation des états, chat sans modération automatique, résilience reconnect.
- **Phase 7 – Tests** : couverture unitaire/e2e côté Nest et Next.
- **Phase 8 – Livraison** : documentation ops, déploiement, cadrage du tableau de bord historique.
