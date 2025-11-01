# Schéma logique WhoIsIt

Ce document décrit le modèle relationnel proposé pour l'application WhoIsIt. Le schéma est optimisé pour PostgreSQL et implémenté via TypeORM dans le backend NestJS.

## Légende rapide

- PK : clé primaire
- FK : clé étrangère
- ❓ champs optionnels (nullable)
- JSONB : stockage JSON côté PostgreSQL

## Tables principales

### `users`

| Colonne | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID | Identifiant unique de l'utilisateur |
| `email` ❓ | TEXT | Adresse e-mail unique (si le joueur crée un compte) |
| `username` ❓ | TEXT | Pseudonyme unique public |
| `display_name` | TEXT | Nom affiché dans les parties |
| `avatar_url` ❓ | TEXT | URL d'avatar |
| `password_hash` ❓ | TEXT | Hash du mot de passe pour connexion locale |
| `locale` ❓ | TEXT | Code de langue préféré |
| `is_guest` | BOOLEAN | Indique un joueur invité sans compte permanent |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de dernière mise à jour |
| `last_seen_at` ❓ | TIMESTAMP | Dernière activité |

- Index : `UNIQUE(email)`, `UNIQUE(username)`, index sur `last_seen_at`.

### `character_sets`

Définit un pack de personnages .

| Colonne | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID | Identifiant du set |
| `name` | TEXT | Nom marketing |
| `slug` | TEXT | Identifiant lisible unique |
| `description` ❓ | TEXT | Présentation |
| `created_by_id` (FK → users) ❓ | UUID | Auteur |
| `visibility` | ENUM(`public`,`private`,`draft`) | Niveau de publication |
| `is_default` | BOOLEAN | Définit si le set charge par défaut |
| `metadata` | JSONB | Données libres (ex : tags) |
| `created_at` | TIMESTAMP | Création |

### `characters`

| Colonne | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID | Identifiant |
| `set_id` (FK → character_sets) | UUID | Set d'appartenance |
| `name` | TEXT | Nom du personnage |
| `slug` | TEXT | Identifiant unique par set |
| `image_url` ❓ | TEXT | Ressource visuelle |
| `summary` ❓ | TEXT | Description |
| `metadata` | JSONB | Données additionnelles |
| `is_active` | BOOLEAN | Permet de masquer un personnage |
| `created_at` | TIMESTAMP | Création |


### `games`

| Colonne | Type | Description |
| --- | --- | --- |
| `id` (PK) | UUID | Identifiant |
| `room_code` | TEXT | Code partageable unique |
| `host_user_id` (FK → users) ❓ | UUID | Hôte |
| `character_set_id` (FK → character_sets) | UUID | Set utilisé |
| `status` | ENUM(`lobby`,`in_progress`,`completed`,`aborted`) | État |
| `visibility` | ENUM(`public`,`private`) | Mode de découverte |
| `max_players` ❓ | INT | Limite de joueurs |
| `turn_timer_seconds` ❓ | INT | Timer par tour |
| `rule_config` | JSONB | Règles additionnelles |
| `created_at` | TIMESTAMP | Création |
| `started_at` ❓ | TIMESTAMP | Début |
| `ended_at` ❓ | TIMESTAMP | Fin |

### `game_invites`

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `game_id` (FK → games) | UUID |
| `invite_code` | TEXT (unique) |
| `invited_email` ❓ | TEXT |
| `expires_at` ❓ | TIMESTAMP |
| `accepted_by_player_id` ❓ (FK → game_players) | UUID |

### `game_players`

Représente chaque participant à une partie.

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `game_id` (FK → games) | UUID |
| `user_id` ❓ (FK → users) | UUID |
| `display_name` | TEXT |
| `avatar_url` ❓ | TEXT |
| `role` | ENUM(`host`,`player`,`spectator`) |
| `seat_order` ❓ | INT |
| `is_ready` | BOOLEAN |
| `joined_at` | TIMESTAMP |
| `left_at` ❓ | TIMESTAMP |
| `reconnect_token` ❓ | TEXT |
| `last_socket_id` ❓ | TEXT |

### `player_secrets`

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `game_player_id` (FK → game_players, unique) | UUID |
| `character_id` (FK → characters) | UUID |
| `status` | ENUM(`hidden`,`revealed`) |
| `assigned_at` | TIMESTAMP |
| `revealed_at` ❓ | TIMESTAMP |

### `game_config_snapshots`

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `game_id` (FK → games) | UUID |
| `version` | INT |
| `settings` | JSONB |
| `created_at` | TIMESTAMP |

### `rounds`

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `game_id` (FK → games) | UUID |
| `round_number` | INT |
| `active_player_id` ❓ (FK → game_players) | UUID |
| `state` | ENUM(`awaiting_question`,`awaiting_answer`,`awaiting_guess`,`closed`) |
| `started_at` ❓ | TIMESTAMP |
| `ended_at` ❓ | TIMESTAMP |
| `duration_ms` ❓ | INT |

### `questions`

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `round_id` (FK → rounds) | UUID |
| `asked_by_player_id` (FK → game_players) | UUID |
| `target_player_id` ❓ (FK → game_players) | UUID |
| `question_text` | TEXT |
| `category` | ENUM(`direct`,`meta`) |
| `answer_type` | ENUM(`boolean`,`text`) |
| `asked_at` | TIMESTAMP |

### `answers`

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `question_id` (FK → questions) | UUID |
| `answered_by_player_id` (FK → game_players) | UUID |
| `answer_value` | ENUM(`yes`,`no`,`unsure`) |
| `answer_text` ❓ | TEXT |
| `latency_ms` ❓ | INT |
| `answered_at` | TIMESTAMP |

### `guesses`

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `round_id` (FK → rounds) | UUID |
| `guessed_by_player_id` (FK → game_players) | UUID |
| `target_player_id` ❓ (FK → game_players) | UUID |
| `target_character_id` (FK → characters) | UUID |
| `is_correct` | BOOLEAN |
| `latency_ms` ❓ | INT |
| `guessed_at` | TIMESTAMP |

### `game_events`

Journal temps réel.

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `game_id` (FK → games) | UUID |
| `round_id` ❓ (FK → rounds) | UUID |
| `event_type` | ENUM(`player_joined`,`player_ready`,`question_asked`,`answer_submitted`,`character_eliminated`,`guess_made`,`timer_expired`,`game_state_changed`) |
| `payload` ❓ | JSONB |
| `actor_player_id` ❓ (FK → game_players) | UUID |
| `created_at` | TIMESTAMP |

### `player_panels`

Optionnel : persiste l'état visuel des cartes côté joueur.

| Colonne | Type |
| --- | --- |
| `id` (PK) | UUID |
| `game_player_id` (FK → game_players) | UUID |
| `character_id` (FK → characters) | UUID |
| `status` | ENUM(`unknown`,`eliminated`,`highlighted`) |
| `updated_at` | TIMESTAMP |

### `player_stats`

Agrégats par utilisateur.

| Colonne | Type |
| --- | --- |
| `user_id` (PK, FK → users) | UUID |
| `games_played` | INT |
| `games_won` | INT |
| `total_questions` | INT |
| `total_guesses` | INT |
| `fastest_win_seconds` ❓ | INT |
| `streak` | INT |
| `updated_at` | TIMESTAMP |

---

## Relations principales (Vue d'ensemble)

- `users` 1─n `character_sets`
- `character_sets` 1─n `characters`
- `users` 1─n `games` (hôte) ; `games` 1─n `game_players`
- `game_players` 1─1 `player_secrets`
- `games` 1─n `rounds` ; `rounds` 1─n `questions` 1─n `answers`
- `rounds` 1─n `guesses`
- `games` 1─n `game_events`
- `users` 1─1 `player_stats`

## Identité & comptes

- **`users`** : référentiel principal des personnes pouvant rejoindre un lobby. Garde les informations d’identification (e-mail, pseudo, avatar, statut invité) et sert de point d’ancrage à toutes les stats et parties jouées.

## Catalogue de personnages

- **`character_sets`** : définit un pack de personnages (ex : « Classique », « Super-héros ») avec son auteur, sa visibilité et des métadonnées de règles.
- **`characters`** : liste les personnages jouables d’un set donné, avec nom, image et attributs libres (JSONB) pour la personnalisation.
## Déroulé d’une partie

- **`games`** : enregistrement maître d’une partie avec code de salle, hôte, set de personnages choisi, état (lobby/en cours/terminée) et configuration des règles.
- **`game_invites`** : stocke les invitations explicites (e-mails, codes temporaires) pour contrôler qui peut rejoindre le lobby.
- **`game_players`** : représente chaque participant dans une partie donnée, qu’il soit inscrit ou invité. Conserve son statut (hôte, joueur, spectateur), son ordre de jeu, son état de préparation et des infos de reconnexion.
- **`player_secrets`** : associe un joueur à son personnage secret et trace quand il a été révélé. Indispensable pour vérifier les guesses.
- **`game_config_snapshots`** : garde une copie versionnée des réglages appliqués à la partie (timers, règles spéciales) pour audit et replays.

## Rounds, questions et guesses

- **`rounds`** : structure le tour par tour, identifie qui doit poser la prochaine question, stocke l’état du round et sa durée effective.
- **`questions`** : conserve chaque question posée pendant un round, avec l’auteur, la cible éventuelle et un type (direct/meta) utile pour les stats.
- **`answers`** : enregistre la réponse à une question (Oui/Non/Incertain ou texte libre), qui répond, la latence et le timestamp.
- **`guesses`** : trace les tentatives de deviner le personnage, indique si elles sont correctes et mesure le temps de réaction.

## Temps réel, historique & état visuel

- **`game_events`** : journal append-only de tout ce qui se passe (connexion, question, guess, changement de statut). Sert de source unique pour la synchronisation en temps réel et la reconstruction d’état.
- **`player_panels`** *(optionnel)* : persiste l’état du plateau de cartes côté joueur (cartes éliminées, mises en avant). Utile si l’on souhaite partager ou restaurer exactement l’UI.

## Statistiques & suivi

- **`player_stats`** : agrège les résultats par utilisateur (parties jouées, victoires, nombre de questions, records de vitesse, séries gagnantes) pour alimenter profils et classements.

Chaque table se rattache ainsi à un segment fonctionnel bien identifié : comptes, contenu de jeu, orchestration des parties, interactions et observabilité. N’hésite pas si tu veux qu’on transforme ça en diagramme visuel ou en entités TypeORM prêtes à l’emploi.
