# Documentation Détaillée du Système de Lobby

## Vue d'Ensemble

Le système de lobby permet aux joueurs de créer et rejoindre des parties avant qu'elles ne commencent. Il supporte à la fois les utilisateurs authentifiés et les invités (guests), avec des mises à jour en temps réel via Socket.IO.

## Architecture

### Composants Principaux

1. **Backend (NestJS)**
   - `game.service.ts` - Logique métier et gestion de la base de données
   - `game.gateway.ts` - WebSocket Gateway pour les mises à jour en temps réel
   - `game.controller.ts` - API REST pour les opérations HTTP

2. **Frontend (Next.js)**
   - `lobby-client.tsx` - Interface utilisateur du lobby
   - `use-game-socket.ts` - Hook pour la communication Socket.IO
   - `game-store.ts` - État global du jeu avec Zustand

3. **Database (PostgreSQL)**
   - `games` - Table des parties
   - `game_players` - Table des joueurs dans les parties

## Flux de Fonctionnement

### 1. Création d'un Lobby

#### 1.1 Utilisateur Authentifié Crée un Lobby

```typescript
// Frontend: Appel API REST
POST /games
{
  characterSetId: "uuid",
  hostUserId: "user-uuid",
  hostUsername: "Username",
  visibility: "public" | "private",
  maxPlayers?: number,
  turnTimerSeconds?: number
}

// Backend: game.service.ts - createGame()
1. Valider le character set existe
2. Valider l'utilisateur hôte existe (si hostUserId fourni)
3. Générer un code de salle unique (5 caractères, ex: "ABC12")
4. Créer l'enregistrement Game avec status = LOBBY
5. Créer l'enregistrement GamePlayer pour l'hôte avec:
   - role = HOST
   - isReady = true (l'hôte est toujours prêt)
6. Retourner l'état du lobby
```

#### 1.2 Invité (Guest) Crée un Lobby

```typescript
// Frontend: Appel API REST (sans authentification)
POST /games
{
  characterSetId: "uuid",
  hostUsername: "GuestHostName",  // Pas de hostUserId
  visibility: "public",
  maxPlayers?: number
}

// Backend: Même processus mais:
1. hostUser reste null dans Game
2. GamePlayer créé avec:
   - user = null (invité)
   - username = hostUsername fourni
   - role = HOST
   - isReady = true
```

**Résultat:** Un lobby est créé avec un code de salle unique (ex: "XYZ89")

### 2. Rejoindre un Lobby

#### 2.1 Via API REST

```typescript
// Frontend: Première étape
POST /games/:roomCode/join
{
  userId?: "user-uuid",      // Pour utilisateurs authentifiés
  username?: "PlayerName",   // Pour invités ou override
  avatarUrl?: "url"
}

// Backend: game.service.ts - joinGame()
1. Normaliser le code de salle (majuscules)
2. Vérifier que la partie existe et est en status LOBBY
3. Vérifier si le joueur existe déjà:
   
   a) Pour utilisateurs authentifiés:
      - Chercher par userId
      - Si trouvé avec leftAt = null → Retourner état actuel
      - Si trouvé avec leftAt != null → Effacer leftAt (rejoin)
   
   b) Pour invités:
      - Chercher par username (insensible à la casse)
      - Même logique de rejoin
   
4. Vérifier la capacité (compter seulement les joueurs actifs)
5. Si nouveau joueur:
   - Créer GamePlayer avec role = PLAYER, isReady = false
6. Retourner l'état du lobby
```

#### 2.2 Via Socket.IO (Temps Réel)

```typescript
// Frontend: Deuxième étape (après REST API)
socket.emit('joinRoom', {
  roomCode: "ABC12",
  playerId: "player-uuid"  // ID du joueur obtenu via REST
})

// Backend: game.gateway.ts - handleJoinRoom()
1. Rejoindre la Socket.IO room (client.join(roomCode))
2. Enregistrer dans connectedUsers:
   {
     socketId: client.id,
     userId: client.user?.id || null,
     roomCode: roomCode,
     playerId: playerId,  // IMPORTANT pour leave
     connectedAt: Date,
     lastSeenAt: Date
   }
3. Récupérer l'état actuel du lobby
4. Envoyer 'lobbyUpdate' au joueur qui rejoint
5. Envoyer 'playerJoined' aux autres joueurs
```

**Événements émis:**

- `lobbyUpdate` → Au joueur qui rejoint
- `playerJoined` → Aux autres joueurs dans le lobby

### 3. Quitter un Lobby

```typescript
// Frontend: Bouton "Leave Lobby"
socket.emit('leaveRoom', {
  roomCode: "ABC12",
  playerId: currentPlayer.id  // ID du joueur actuel
})

// Backend: game.gateway.ts - handleLeaveRoom()
1. Obtenir playerId depuis:
   - Le paramètre de la requête (priorité)
   - OU connection tracking (connectedUsers)
   - OU recherche dans le lobby par userId
   
2. Quitter la Socket.IO room (client.leave(roomCode))

3. Nettoyer connection tracking:
   - Effacer roomCode
   - Effacer playerId
   
4. Marquer le joueur comme parti dans la DB:
   - gameService.markPlayerAsLeft(playerId)
   - Définit leftAt = NOW
   
5. Récupérer l'état mis à jour du lobby

6. Notifier les autres joueurs:
   - Émettre 'playerLeft' avec nouveau lobby
   - Émettre 'lobbyUpdate' pour synchronisation
```

**Événements émis:**

- `playerLeft` → Aux autres joueurs
- `lobbyUpdate` → Aux autres joueurs

**Important:** Les joueurs avec `leftAt != null` sont filtrés de l'affichage par `mapToLobbyResponse()`

### 4. Toggle Ready State

```typescript
// Frontend: Bouton "Ready" / "Not Ready"
socket.emit('updatePlayerReady', {
  roomCode: "ABC12",
  playerId: "player-uuid",
  isReady: true/false
})

// Backend: game.gateway.ts - handleUpdatePlayerReady()
1. Vérifier que le jeu est en status LOBBY
2. Mettre à jour player.isReady dans la DB
3. Récupérer l'état mis à jour du lobby
4. Émettre 'lobbyUpdate' à TOUS les joueurs (y compris sender)
```

**Événement émis:**

- `lobbyUpdate` → À tous les joueurs dans le lobby

### 5. Démarrer la Partie

```typescript
// Frontend: Bouton "Start Game" (hôte seulement)
POST /games/:roomCode/start

// Backend: game.controller.ts → game.service.ts
1. Vérifier que le jeu est en status LOBBY
2. Vérifier qu'il y a au moins 2 joueurs
3. Vérifier que TOUS les joueurs sont ready
4. Mettre à jour:
   - game.status = IN_PROGRESS
   - game.startedAt = NOW
5. Initialiser le premier round
6. Assigner des personnages secrets aux joueurs
7. Via gateway: Émettre 'gameStarted' à tous

// Backend: game.gateway.ts - broadcastGameStarted()
- Émettre 'gameStarted' avec état final du lobby
```

**Événement émis:**

- `gameStarted` → À tous les joueurs

## Gestion des Joueurs

### Types de Joueurs

#### 1. Utilisateur Authentifié

```typescript
GamePlayer {
  id: "uuid",
  user: User { id: "user-uuid", username: "user123", ... },
  username: "DisplayName",
  userId: "user-uuid",  // Dans la réponse
  role: "host" | "player",
  isReady: boolean,
  joinedAt: Date,
  leftAt: null | Date
}
```

**Identification:** Par `userId`

#### 2. Invité (Guest)

```typescript
GamePlayer {
  id: "uuid",
  user: null,
  username: "GuestName",
  userId: undefined,  // Dans la réponse
  role: "host" | "player",
  isReady: boolean,
  joinedAt: Date,
  leftAt: null | Date
}
```

**Identification:** Par `username` (insensible à la casse)

### États d'un Joueur

1. **Actif** - `leftAt = null`
   - Apparaît dans la liste des participants
   - Compte dans la capacité du lobby
   - Peut interagir (toggle ready, etc.)

2. **Parti** - `leftAt != null`
   - Filtré de la liste des participants
   - Ne compte PAS dans la capacité
   - Peut revenir (rejoin)

3. **Rejoint** - `leftAt` effacé après avoir été parti
   - Même enregistrement GamePlayer réutilisé
   - Pas de doublon créé
   - `isReady` réinitialisé à `false`

## Scénarios Complexes

### Scénario 1: Rejoin Utilisateur Authentifié

```asciidoc
1. UserA (userId="abc") rejoint le lobby
   → GamePlayer créé avec user.id="abc", leftAt=null
   
2. UserA quitte
   → leftAt = NOW
   → UserA disparaît de la liste
   
3. UserA rejoint avec le même userId
   → Trouve GamePlayer existant avec user.id="abc"
   → leftAt = null (effacé)
   → isReady = false (réinitialisé)
   → UserA réapparaît (pas de doublon)
```

### Scénario 2: Rejoin Invité

```asciidoc
1. Guest rejoint avec username="GuestPlayer"
   → GamePlayer créé avec user=null, username="GuestPlayer"
   
2. Guest quitte
   → leftAt = NOW
   → Guest disparaît
   
3. Guest rejoint avec username="guestplayer" (casse différente)
   → Cherche GamePlayer avec username insensible à la casse
   → Trouve "GuestPlayer"
   → leftAt = null
   → Guest réapparaît (pas de doublon)
```

### Scénario 3: Capacité avec Joueurs Partis

```asciidoc
Lobby: maxPlayers = 3

État actuel:
- Player1 (actif, leftAt=null)
- Player2 (actif, leftAt=null)  
- Player3 (parti, leftAt=NOW)

Player4 essaie de rejoindre:
→ Compte joueurs actifs: filter(p => !p.leftAt)
→ Résultat: 2 joueurs actifs
→ 2 < 3 → Player4 PEUT rejoindre ✓

Si Player3 essaie de revenir après Player4:
→ 3 joueurs actifs (Player1, Player2, Player4)
→ 3 >= 3 → Player3 NE PEUT PAS rejoindre ✗
```

### Scénario 4: Invité Déconnecté (WebSocket)

```asciidoc
1. Guest rejoint via REST API
   → GamePlayer créé, playerId="guest-123"
   
2. Guest rejoint via Socket.IO
   socket.emit('joinRoom', { roomCode, playerId: "guest-123" })
   → Connection tracking: { playerId: "guest-123", ... }
   
3. WebSocket se déconnecte (perte réseau)
   → handleDisconnect() appelé
   → Connection supprimée de connectedUsers
   → GamePlayer reste ACTIF (leftAt = null)
   
4. Guest se reconnecte
   → REST: joinGame() trouve GamePlayer existant (pas de leftAt)
   → Retourne état actuel (pas de changement)
   → Socket: joinRoom() crée nouvelle connection
   → Guest toujours visible dans le lobby ✓
```

### Scénario 5: Leave via Socket.IO

```asciidoc
Cas A: Utilisateur Authentifié Leave
→ playerId disponible via:
  1. Paramètre leaveRoom({ playerId })
  2. OU connection.playerId (tracking)
  3. OU recherche par userId dans lobby
→ markPlayerAsLeft(playerId) appelé
→ Joueur disparaît ✓

Cas B: Invité Leave
→ playerId disponible via:
  1. Paramètre leaveRoom({ playerId })  ← SOLUTION
  2. OU connection.playerId (tracking)
→ markPlayerAsLeft(playerId) appelé
→ Invité disparaît ✓

Note: client.user est null pour invités, donc on ne peut
pas utiliser userId ou username pour les trouver. Le
playerId DOIT être fourni ou stocké.
```

## Filtrage et Affichage

### Backend: mapToLobbyResponse()

```typescript
private mapToLobbyResponse(game: Game): GameLobbyResponse {
  // Filtrer les joueurs partis
  const players = [...(game.players ?? [])]
    .filter((player) => !player.leftAt)  // ← CLEF
    .sort((a, b) => {
      const aTime = a.joinedAt?.getTime?.() ?? 0;
      const bTime = b.joinedAt?.getTime?.() ?? 0;
      return aTime - bTime;
    });

  // Mapper vers réponse
  const playerResponses: GamePlayerResponse[] = players.map((player) => ({
    id: player.id,
    username: player.username,
    avatarUrl: player.avatarUrl ?? undefined,
    role: player.role,
    isReady: player.isReady,
    joinedAt: player.joinedAt.toISOString(),
    leftAt: player.leftAt?.toISOString(),  // Toujours null ici
    userId: player.user?.id,
  }));

  return { /* ... */ players: playerResponses };
}
```

**Points clés:**

- Seuls les joueurs avec `leftAt = null` sont inclus
- Tri par date de join (anciens d'abord)
- `leftAt` dans la réponse est toujours undefined car filtré

### Frontend: Affichage

```typescript
// lobby-client.tsx
const currentPlayer = lobby?.players.find(
  (p) => p.username === user?.username || p.userId === user?.id,
);

// Tous les joueurs affichés sont actifs (leftAt filtré par backend)
{lobby.players.map((player) => (
  <PlayerCard key={player.id} player={player} />
))}
```

## Événements Socket.IO

### Événements Serveur → Client

1. **`lobbyUpdate`**
   - **Quand:** Après join, ready toggle, start game
   - **Données:** `GameLobbyResponse`
   - **Cible:** Tous les joueurs dans le lobby

2. **`playerJoined`**
   - **Quand:** Un joueur rejoint
   - **Données:** `{ roomCode, lobby: GameLobbyResponse }`
   - **Cible:** Autres joueurs (pas celui qui rejoint)

3. **`playerLeft`**
   - **Quand:** Un joueur quitte
   - **Données:** `{ roomCode, lobby: GameLobbyResponse }`
   - **Cible:** Autres joueurs (pas celui qui quitte)

4. **`gameStarted`**
   - **Quand:** Hôte démarre la partie
   - **Données:** `{ roomCode, lobby: GameLobbyResponse }`
   - **Cible:** Tous les joueurs

### Événements Client → Serveur

1. **`joinRoom`**
   - **Paramètres:** `{ roomCode, playerId? }`
   - **Retour:** `{ success, lobby?, error? }`

2. **`leaveRoom`**
   - **Paramètres:** `{ roomCode, playerId? }`
   - **Retour:** `{ success, error? }`

3. **`updatePlayerReady`**
   - **Paramètres:** `{ roomCode, playerId, isReady }`
   - **Retour:** `{ success, lobby?, error? }`

## Gestion des Erreurs

### Erreurs Communes

1. **Game not found**
   - Code de salle invalide
   - Partie supprimée

2. **Game is not joinable**
   - Partie déjà commencée (status != LOBBY)
   - Partie terminée

3. **Game is full**
   - Nombre de joueurs actifs >= maxPlayers
   - Vérifier que leftAt est bien filtré

4. **Player not found**
   - PlayerId invalide
   - Joueur déjà supprimé

5. **All players must be ready**
   - Au moins un joueur avec isReady = false
   - Hôte essaie de démarrer trop tôt

### Gestion des Déconnexions

```asciidoc
WebSocket Déconnexion:
→ handleDisconnect() appelé automatiquement
→ Connection supprimée de connectedUsers
→ GamePlayer RESTE dans la DB (leftAt = null)
→ Joueur considéré comme "toujours dans le lobby"
→ Peut se reconnecter sans problème

Leave Explicite:
→ handleLeaveRoom() appelé par client
→ leftAt = NOW dans la DB
→ Joueur RETIRÉ du lobby
→ Peut rejoindre plus tard (rejoin)
```

## Sécurité et Validation

### Validation des Entrées

1. **Room Code**
   - Toujours normalisé en majuscules
   - Longueur: 5 caractères
   - Alphanumérique sans ambiguïté (pas de O, I, 0, 1)

2. **Username**
   - Requis pour invités
   - Trimé (espaces enlevés)
   - Peut être différent du username authentifié

3. **PlayerId**
   - Format UUID
   - Doit correspondre à un joueur existant
   - Validé côté serveur

### Authentification

1. **WebSocket (ws-auth.adapter.ts)**
   - Extrait token JWT des cookies ou query
   - Valide le token
   - Attache user à socket: `client.user`
   - Si invalide: `client.user = null` (guest)

2. **REST API**
   - Utilise guards NestJS standard
   - Routes protégées nécessitent auth
   - Création/join publics (permettent guests)

## Performance et Optimisation

### Connection Tracking

```typescript
// In-memory Map pour performance
private readonly connectedUsers = new Map<string, ConnectedUser>();

// Avantages:
- Lookup O(1) par socketId
- Pas de DB query pour chaque événement
- Nettoyé automatiquement à disconnect
```

### Cleanup Périodique

```typescript
// Toutes les 5 minutes
private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Nettoie les lobbies:
- Sans joueurs connectés
- Status LOBBY
- Plus vieux que 30 minutes
```

### Broadcasting Optimisé

```typescript
// Émission ciblée par room
this.server.to(roomCode).emit('lobbyUpdate', lobby);

// Évite:
- Broadcasting global
- Envoi à tous les clients
- Charge réseau inutile
```

## Base de Données

### Schema Game

```sql
games {
  id: UUID PRIMARY KEY,
  room_code: VARCHAR(5) UNIQUE NOT NULL,
  status: ENUM('lobby', 'in_progress', 'completed', 'aborted'),
  visibility: ENUM('public', 'private'),
  host_id: UUID REFERENCES users(id),  -- null pour guests
  character_set_id: UUID NOT NULL,
  max_players: INTEGER,
  turn_timer_seconds: INTEGER,
  rule_config: JSONB,
  created_at: TIMESTAMP,
  started_at: TIMESTAMP,
  ended_at: TIMESTAMP
}
```

### Schema GamePlayer

```sql
game_players {
  id: UUID PRIMARY KEY,
  game_id: UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id: UUID REFERENCES users(id) ON DELETE SET NULL,  -- null pour guests
  username: TEXT NOT NULL,
  avatar_url: TEXT,
  role: ENUM('host', 'player', 'spectator'),
  seat_order: INTEGER,
  is_ready: BOOLEAN DEFAULT false,
  joined_at: TIMESTAMP DEFAULT NOW(),
  left_at: TIMESTAMP,  -- null = actif, set = parti
  reconnect_token: TEXT,
  last_socket_id: TEXT
}
```

### Requêtes Importantes

```sql
-- Obtenir lobby avec joueurs actifs
SELECT g.*, COUNT(gp.id) as active_players
FROM games g
LEFT JOIN game_players gp ON g.id = gp.game_id AND gp.left_at IS NULL
WHERE g.room_code = 'ABC12'
GROUP BY g.id;

-- Vérifier capacité
SELECT COUNT(*) as active_count
FROM game_players
WHERE game_id = 'game-uuid' AND left_at IS NULL;

-- Trouver joueur pour rejoin
SELECT * FROM game_players
WHERE game_id = 'game-uuid'
  AND (
    -- Utilisateur authentifié
    (user_id = 'user-uuid')
    OR
    -- Invité
    (user_id IS NULL AND LOWER(username) = LOWER('GuestName'))
  );
```

## Tests

### Tests Unitaires Clés

1. **joinGame()**
   - ✓ Utilisateur authentifié rejoint
   - ✓ Invité rejoint
   - ✓ Utilisateur authentifié rejoint après leave
   - ✓ Invité rejoint après leave
   - ✓ Capacité compte seulement joueurs actifs
   - ✓ Erreur si partie pleine
   - ✓ Erreur si partie non-LOBBY

2. **markPlayerAsLeft()**
   - ✓ Définit leftAt à NOW
   - ✓ Erreur si joueur introuvable

3. **handleJoinRoom()**
   - ✓ Rejoint Socket.IO room
   - ✓ Met à jour connection tracking
   - ✓ Émet lobbyUpdate au joiner
   - ✓ Émet playerJoined aux autres

4. **handleLeaveRoom()**
   - ✓ Quitte Socket.IO room
   - ✓ Marque joueur comme parti
   - ✓ Émet playerLeft aux autres
   - ✓ Gère erreurs gracieusement

## Dépannage

### Problème: Invité ne disparaît pas après leave

**Solution:** S'assurer que:

1. `playerId` est envoyé dans `leaveRoom()`
2. `connection.playerId` est défini dans `joinRoom()`
3. `markPlayerAsLeft()` est appelé avec le bon playerId

### Problème: Joueur apparaît en doublon après rejoin

**Solution:** Vérifier:

1. Logique de recherche dans `joinGame()`
2. Pour authentifiés: match par `userId`
3. Pour invités: match par `username` insensible casse
4. `leftAt` est bien effacé sur rejoin

### Problème: Lobby affiche joueurs partis

**Solution:** Vérifier:

1. `mapToLobbyResponse()` filtre `!player.leftAt`
2. `leftAt` est bien défini dans `markPlayerAsLeft()`
3. Backend émet `lobbyUpdate` après leave

### Problème: "Game is full" mais places libres

**Solution:** Vérifier:

1. Compte seulement `filter(p => !p.leftAt)`
2. Pas de comptage de tous les GamePlayer
3. Query TypeORM charge bien les relations

## Diagrammes

### Diagramme de Séquence: Join Complet

```asciidoc
Client          REST API        Socket.IO       Database
  |                |                |               |
  |-- POST join -->|                |               |
  |                |-- validate --->|               |
  |                |-- check exist->|               |
  |                |                |-- query ----->|
  |                |                |<-- result ----|
  |                |<-- GamePlayer--|               |
  |<-- lobby -------|                |               |
  |                |                |               |
  |-- emit joinRoom ->              |               |
  |                |                |-- join room ->|
  |                |                |-- track ----->|
  |<-- lobbyUpdate --|<-- emit -----|               |
  |                others           |               |
  |                |<-- playerJoined-|              |
```

### Diagramme de Séquence: Leave

```asciidoc
Client          Socket.IO       Database
  |                |               |
  |-- emit leaveRoom ->            |
  |                |-- get playerId|
  |                |-- leave room->|
  |                |-- markLeft -->|
  |                |               |-- UPDATE ---->|
  |                |               |<-- OK --------|
  |<-- success ----|               |
  |                others          |
  |                |-- playerLeft->|
  |                |-- lobbyUpdate>|
```

## Résumé des Corrections Récentes

### Fix #1: Rejoin Logic

- **Problème:** Joueurs invisibles après rejoin
- **Solution:** Effacer `leftAt` sur rejoin existant

### Fix #2: Guest Leave

- **Problème:** Invités ne disparaissent pas
- **Solution:** Tracker et utiliser `playerId` dans connections

### Fix #3: Capacity Check

- **Problème:** Joueurs partis bloquent nouveaux joins
- **Solution:** Compter seulement `leftAt = null`

## Références Code

- **Backend Service:** `apps/backend/src/game/game.service.ts`
- **Backend Gateway:** `apps/backend/src/game/game.gateway.ts`
- **Backend Controller:** `apps/backend/src/game/game.controller.ts`
- **Frontend Component:** `apps/frontend/app/[lang]/game/lobby/[roomCode]/lobby-client.tsx`
- **Contracts:** `packages/contracts/index.d.ts`
- **Tests Service:** `apps/backend/src/game/game.service.spec.ts`
- **Tests Gateway:** `apps/backend/src/game/game.gateway.spec.ts`
