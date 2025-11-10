# TODO: Conversion du projet pour un jeu à 2 joueurs uniquement

## Analyse du projet

Le projet "WhoIsIt" (Qui est-ce ?) est actuellement conçu pour supporter plusieurs joueurs (2+), mais comme le jeu classique "Qui est-ce ?" se joue strictement à 2 joueurs, cette flexibilité ajoute de la complexité inutile.

### Fonctionnalités actuelles à simplifier :

1. **Gestion dynamique du nombre de joueurs** (`maxPlayers` optionnel)
2. **Ciblage de joueurs multiples** (`targetPlayer` optionnel dans les questions et devinettes)
3. **Ordre des sièges** (`seatOrder`) pour gérer la rotation des tours entre plusieurs joueurs
4. **Validation "au moins 2 joueurs"** au lieu de "exactement 2 joueurs"
5. **Logique de rôles multiples** (host, player, spectator)
6. **Gestion de "plusieurs autres joueurs"** dans la logique du jeu

---

## Plan de conversion vers un système à 2 joueurs strictement

### Phase 1: Backend - Contrats et Types (packages/contracts)

**Fichiers à modifier:**
- [ ] `packages/contracts/index.d.ts`

**Changements:**
- [ ] Supprimer `maxPlayers?: number | null;` de `CreateGameRequest`
- [ ] Rendre `targetPlayerId` **requis** (non optionnel) dans `AskQuestionRequest` - il y a toujours un seul adversaire
- [ ] Rendre `targetPlayerId` **requis** (non optionnel) dans `SubmitGuessRequest` - on devine toujours le personnage de l'adversaire
- [ ] Ajouter une constante/documentation indiquant que le jeu est strictement à 2 joueurs
- [ ] Considérer la suppression du rôle `SPECTATOR` de `GamePlayerRole` (garder seulement `HOST` et `PLAYER`)

---

### Phase 2: Backend - Base de données

#### 2.1 Entités (apps/backend/src/database/entities)

**Fichiers à modifier:**
- [ ] `game.entity.ts` - Supprimer le champ `maxPlayers` (toujours 2)
- [ ] `game-player.entity.ts` - Considérer la suppression du champ `seatOrder` (inutile avec 2 joueurs)
- [ ] `question.entity.ts` - Rendre `targetPlayer` requis (non nullable)
- [ ] `guess.entity.ts` - Rendre `targetPlayer` requis (non nullable)

#### 2.2 Enums (apps/backend/src/database/enums.ts)

**Fichiers à modifier:**
- [ ] `enums.ts` - Considérer la suppression de `SPECTATOR` du `GamePlayerRole` enum

#### 2.3 Migration de base de données

**Actions requises:**
- [ ] Créer une nouvelle migration pour:
  - [ ] Supprimer la colonne `max_players` de la table `games`
  - [ ] Modifier la colonne `target_player_id` en `NOT NULL` dans la table `questions` (nécessite de traiter les données existantes)
  - [ ] Modifier la colonne `target_player_id` en `NOT NULL` dans la table `guesses` (nécessite de traiter les données existantes)
  - [ ] Optionnel: Supprimer la colonne `seat_order` de la table `game_players`
  - [ ] Optionnel: Supprimer la valeur 'spectator' de l'enum `game_player_role`

---

### Phase 3: Backend - Services

#### 3.1 Game Lobby Service (apps/backend/src/game/services/game-lobby.service.ts)

**Changements:**
- [ ] Supprimer le paramètre `maxPlayers` de la méthode `createGame`
- [ ] Supprimer le helper `normalizeOptionalNumber` si utilisé uniquement pour `maxPlayers`
- [ ] Modifier la logique de `joinGame` pour:
  - [ ] Remplacer la vérification "game is full" dynamique par une vérification stricte: "exactement 2 joueurs"
  - [ ] Empêcher un 3ème joueur de rejoindre (toujours)
- [ ] Simplifier `mapToLobbyResponse` en supprimant `maxPlayers`

#### 3.2 Game Service (apps/backend/src/game/services/game.service.ts)

**Changements:**
- [ ] Modifier la validation `startGame` de "au moins 2 joueurs" à "exactement 2 joueurs"
- [ ] Retirer la logique de vérification dynamique de `maxPlayers`

#### 3.3 Game Play Service (apps/backend/src/game/services/game-play.service.ts)

**Changements:**
- [ ] Supprimer la gestion de `targetPlayer` optionnel dans `askQuestion`
  - [ ] Toujours exiger un `targetPlayerId` dans la requête
  - [ ] Automatiquement déduire l'adversaire si nécessaire (le joueur qui n'est pas l'auteur de la question)
- [ ] Supprimer la gestion de `targetPlayer` optionnel dans `submitGuess`
  - [ ] Toujours exiger un `targetPlayerId` dans la requête
  - [ ] Automatiquement déduire l'adversaire (le joueur qui n'est pas l'auteur de la devinette)
- [ ] Simplifier `assignSecretCharacters` car il y aura toujours exactement 2 joueurs
- [ ] Simplifier la logique de rotation des tours (il suffit d'alterner entre 2 joueurs)

---

### Phase 4: Backend - Contrôleur (apps/backend/src/game/game.controller.ts)

**Changements:**
- [ ] Retirer la validation et le traitement de `maxPlayers` dans le endpoint `POST /games`
- [ ] Ajouter une validation pour s'assurer que `targetPlayerId` est fourni dans `POST /:roomCode/questions`
- [ ] Ajouter une validation pour s'assurer que `targetPlayerId` est fourni dans `POST /:roomCode/guesses`

---

### Phase 5: Backend - Tests

**Fichiers à modifier:**
- [ ] `apps/backend/src/game/services/game-lobby.service.spec.ts`
  - [ ] Retirer les tests pour `maxPlayers`
  - [ ] Ajouter des tests pour la validation "exactement 2 joueurs"
  - [ ] Tester le rejet d'un 3ème joueur qui tente de rejoindre
  
- [ ] `apps/backend/src/game/services/game.service.spec.ts` ou `apps/backend/src/game/__tests__/game.service.spec.ts`
  - [ ] Mettre à jour les tests de `startGame` pour vérifier "exactement 2 joueurs"
  
- [ ] `apps/backend/src/game/services/game-play.service.spec.ts`
  - [ ] Retirer les tests avec `targetPlayer` optionnel
  - [ ] Ajouter des tests pour valider que `targetPlayerId` est requis
  
- [ ] `apps/backend/src/game/game.controller.spec.ts`
  - [ ] Retirer les tests pour `maxPlayers`
  - [ ] Ajouter des tests pour valider les nouveaux requis sur `targetPlayerId`

- [ ] `apps/backend/src/game/__tests__/game.gateway.spec.ts`
  - [ ] Vérifier et mettre à jour les tests de WebSocket selon les nouveaux comportements

---

### Phase 6: Frontend - Formulaire de création de jeu

**Fichiers à modifier:**
- [ ] `apps/frontend/app/[lang]/game/create/create-game-form.tsx`
  - [ ] Supprimer le champ de saisie `maxPlayers`
  - [ ] Supprimer l'état `maxPlayers` et sa logique
  - [ ] Retirer l'ajout de `maxPlayers` à `gameData` dans `handleSubmit`
  - [ ] Optionnel: Ajouter un texte explicatif indiquant que le jeu se joue à 2 joueurs

---

### Phase 7: Frontend - Lobby

**Fichiers à modifier:**
- [ ] `apps/frontend/app/[lang]/game/lobby/[roomCode]/lobby-client.tsx`
  - [ ] Modifier l'affichage pour montrer "1/2" ou "2/2" au lieu de "X/maxPlayers"
  - [ ] Ajouter une indication claire que le jeu nécessite exactement 2 joueurs
  - [ ] Empêcher le démarrage si pas exactement 2 joueurs
  - [ ] Simplifier la logique de "tous les joueurs sont prêts" (juste vérifier les 2 joueurs)

---

### Phase 8: Frontend - Gameplay

**Fichiers à modifier:**
- [ ] `apps/frontend/lib/hooks/use-game-actions.ts`
  - [ ] Supprimer la logique conditionnelle dans `handleConfirmGuess` qui traite les cas multi-joueurs
  - [ ] Simplifier: toujours cibler l'adversaire unique (le seul autre joueur)
  - [ ] Retirer les commentaires sur "multiplayer" (lignes 80-93)
  - [ ] Toujours envoyer `targetPlayerId` (jamais undefined)

- [ ] `apps/frontend/app/[lang]/game/play/[roomCode]/*` (tous les composants de jeu)
  - [ ] Vérifier et simplifier toute logique qui gère plusieurs adversaires
  - [ ] S'assurer que l'interface montre toujours clairement les 2 joueurs

---

### Phase 9: Frontend - Dictionnaires et traductions

**Fichiers à modifier:**
- [ ] `apps/frontend/dictionaries/en.json`
  - [ ] Supprimer ou modifier les clés liées à `maxPlayers`
  - [ ] Ajouter/modifier les textes pour refléter le jeu à 2 joueurs
  
- [ ] `apps/frontend/dictionaries/fr.json`
  - [ ] Supprimer ou modifier les clés liées à `maxPlayers`
  - [ ] Ajouter/modifier les textes pour refléter le jeu à 2 joueurs

- [ ] `apps/frontend/dictionaries/types.ts`
  - [ ] Mettre à jour les types si nécessaire

---

### Phase 10: Documentation

**Fichiers à modifier:**
- [ ] `README.md` - Indiquer clairement que le jeu est à 2 joueurs
- [ ] `docs/api/types.md` - Mettre à jour les types de l'API
- [ ] `docs/api/rest-api.md` - Documenter les changements dans les endpoints
- [ ] `docs/api/socket-events.md` - Mettre à jour "Minimum 2 players required" en "Exactly 2 players required"
- [ ] `docs/architecture/overview.md` - Mettre à jour "multiplayer" en "2-player"
- [ ] `docs/README.md` - Mettre à jour la description générale
- [ ] `.github/copilot-instructions.md` - Mettre à jour les instructions pour refléter le jeu à 2 joueurs

---

### Phase 11: Configuration et environnement

**Fichiers à vérifier:**
- [ ] `apps/backend/.env.example` - Vérifier qu'aucune variable d'environnement liée à `maxPlayers` existe
- [ ] `apps/frontend/.env.example` - Vérifier qu'aucune variable d'environnement liée à `maxPlayers` existe

---

### Phase 12: Validation finale

**Actions de test:**
- [ ] Exécuter tous les tests backend: `pnpm test:backend`
- [ ] Exécuter tous les tests frontend: `pnpm test:frontend` (si des tests existent)
- [ ] Exécuter le linter: `pnpm lint`
- [ ] Construire le projet: `pnpm build`
- [ ] Test manuel complet:
  - [ ] Créer une partie (vérifier que maxPlayers n'apparaît plus)
  - [ ] Rejoindre avec un 2ème joueur
  - [ ] Vérifier qu'un 3ème joueur ne peut pas rejoindre
  - [ ] Démarrer la partie avec exactement 2 joueurs
  - [ ] Jouer un tour complet (question, réponse, devinette)
  - [ ] Vérifier que tous les événements Socket.IO fonctionnent correctement
  - [ ] Compléter une partie jusqu'à la fin

---

## Notes importantes

### Ordre d'implémentation recommandé:

1. **Commencer par les contrats** (Phase 1) - c'est la source de vérité partagée
2. **Mettre à jour la base de données** (Phase 2) - infrastructure de base
3. **Adapter les services backend** (Phases 3-4) - logique métier
4. **Mettre à jour les tests backend** (Phase 5) - validation
5. **Adapter le frontend** (Phases 6-8) - interface utilisateur
6. **Mettre à jour les traductions** (Phase 9) - UX
7. **Mettre à jour la documentation** (Phase 10) - communication
8. **Validation finale** (Phase 12) - assurance qualité

### Impacts sur les données existantes:

⚠️ **Attention:** La suppression de `maxPlayers` et le changement de `targetPlayer` en requis nécessiteront:
- Une stratégie de migration pour les parties existantes
- Possiblement marquer les anciennes parties comme "aborted" si elles ont plus de 2 joueurs
- Nettoyer ou convertir les données de questions/devinettes avec `targetPlayer` null

### Avantages de cette conversion:

✅ **Simplification du code:**
- Moins de branches conditionnelles
- Logique de jeu plus directe
- Moins de cas de test à maintenir

✅ **Meilleure expérience utilisateur:**
- Interface plus claire (toujours 2 joueurs)
- Pas de confusion sur le nombre de joueurs
- Conforme au jeu "Qui est-ce ?" classique

✅ **Performance:**
- Moins de vérifications dynamiques
- Requêtes de base de données plus simples

✅ **Maintenance:**
- Code plus facile à comprendre
- Moins de bugs potentiels liés au nombre de joueurs variable

---

## Risques et considérations

🔴 **Risques majeurs:**
- Breaking changes pour toute partie en cours
- Nécessite une migration de base de données
- Incompatibilité avec les anciennes versions du client

🟡 **Considérations:**
- Si des utilisateurs ont des parties sauvegardées avec plus de 2 joueurs, décider comment les gérer
- Tester particulièrement les cas de reconnexion et de parties interrompues
- S'assurer que tous les événements Socket.IO sont mis à jour en cohérence

---

## Estimation de l'effort

- **Phase 1:** ~1-2 heures (contrats)
- **Phase 2:** ~2-3 heures (base de données + migration)
- **Phase 3:** ~3-4 heures (services backend)
- **Phase 4:** ~1 heure (contrôleur)
- **Phase 5:** ~4-5 heures (tests backend)
- **Phase 6:** ~1 heure (formulaire création)
- **Phase 7:** ~2 heures (lobby)
- **Phase 8:** ~2-3 heures (gameplay)
- **Phase 9:** ~1 heure (traductions)
- **Phase 10:** ~2 heures (documentation)
- **Phase 11:** ~30 minutes (config)
- **Phase 12:** ~3-4 heures (validation complète)

**Total estimé:** ~22-27 heures de travail

---

## Checklist de validation finale

Avant de considérer la conversion comme terminée:

- [ ] ✅ Tous les tests passent
- [ ] ✅ Le build réussit sans warnings
- [ ] ✅ Le linter ne remonte aucune erreur
- [ ] ✅ La documentation est à jour
- [ ] ✅ Les migrations de base de données sont testées
- [ ] ✅ Une partie complète peut être jouée de bout en bout
- [ ] ✅ Les traductions sont cohérentes (en et fr)
- [ ] ✅ Les événements Socket.IO fonctionnent correctement
- [ ] ✅ Les erreurs affichent les bons messages
- [ ] ✅ Impossible de rejoindre une partie avec plus de 2 joueurs
- [ ] ✅ Impossible de démarrer une partie sans exactement 2 joueurs

---

**Dernière mise à jour:** 2025-11-10
**Statut:** TODO non démarré - Analyse complète réalisée
