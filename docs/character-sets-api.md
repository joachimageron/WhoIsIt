# Character Sets API Documentation

This document describes the RESTful endpoints for managing character sets and characters in the WhoIsIt backend.

## Base URL

```
http://localhost:4000
```

## Endpoints

### List All Character Sets

Returns a list of all available character sets.

**Endpoint:** `GET /character-sets`

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Classic Characters",
    "slug": "classic-characters",
    "description": "A classic set of diverse characters for guessing games",
    "visibility": "public",
    "isDefault": true,
    "metadata": {
      "theme": "classic"
    },
    "characterCount": 24
  }
]
```

### Get a Specific Character Set

Returns details about a single character set by ID.

**Endpoint:** `GET /character-sets/:id`

**Response:**

```json
{
  "id": "uuid",
  "name": "Classic Characters",
  "slug": "classic-characters",
  "description": "A classic set of diverse characters for guessing games",
  "visibility": "public",
  "isDefault": true,
  "metadata": {
    "theme": "classic"
  },
  "characterCount": 24
}
```

**Error Responses:**

- `404 Not Found` if the character set does not exist

### List Characters in a Character Set

Returns all active characters in a specific character set.

**Endpoint:** `GET /character-sets/:id/characters`

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Alice",
    "slug": "alice",
    "imageUrl": "/character/character_0.jpg",
    "summary": "Alice is a character in the classic set",
    "metadata": {},
    "isActive": true
  },
  {
    "id": "uuid",
    "name": "Bob",
    "slug": "bob",
    "imageUrl": "/character/character_1.jpg",
    "summary": "Bob is a character in the classic set",
    "metadata": {},
    "isActive": true
  }
]
```

**Notes:**

- Only active characters (`isActive: true`) are returned
- Characters are sorted by name in ascending order
- The response does not include inactive characters

**Error Responses:**

- `404 Not Found` if the character set does not exist

## Data Models

### CharacterSet

| Field           | Type                  | Description                                      |
| --------------- | --------------------- | ------------------------------------------------ |
| `id`            | `string` (UUID)       | Unique identifier                                |
| `name`          | `string`              | Display name of the character set                |
| `slug`          | `string`              | URL-friendly identifier                          |
| `description`   | `string` \| `null`    | Optional description                             |
| `visibility`    | `'public'|'private'`  | Visibility setting                               |
| `isDefault`     | `boolean`             | Whether this is the default character set        |
| `metadata`      | `Record<string, any>` | Additional metadata (JSON)                       |
| `characterCount`| `number`              | Number of characters in the set                  |

### Character

| Field       | Type                  | Description                    |
| ----------- | --------------------- | ------------------------------ |
| `id`        | `string` (UUID)       | Unique identifier              |
| `name`      | `string`              | Character's display name       |
| `slug`      | `string`              | URL-friendly identifier        |
| `imageUrl`  | `string` \| `null`    | URL to character image         |
| `summary`   | `string` \| `null`    | Brief description              |
| `metadata`  | `Record<string, any>` | Additional metadata (JSON)     |
| `isActive`  | `boolean`             | Whether the character is active|

## Usage Examples

### Creating a Game with a Character Set

When creating a new game, you specify the character set by its ID:

```typescript
POST /games
{
  "characterSetId": "uuid-from-character-sets-list",
  "hostUsername": "Alice",
  "visibility": "public",
  "maxPlayers": 4
}
```

The game will use characters from the specified character set for gameplay.

### Frontend Integration

In the frontend, you can fetch character sets and their characters:

```typescript
// Fetch all character sets
const characterSets = await fetch('/character-sets').then(res => res.json());

// Get characters for a specific set
const characters = await fetch(`/character-sets/${setId}/characters`)
  .then(res => res.json());
```

## Implementation Notes

- Character sets are seeded during database initialization
- The "Classic Characters" set is marked as `isDefault: true`
- All character set operations currently use TypeORM repositories
- Character images are served from the `/character/` path
