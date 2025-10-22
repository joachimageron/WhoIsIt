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
    "characterCount": 8
  },
  {
    "id": "uuid",
    "name": "Fantasy Heroes",
    "slug": "fantasy-heroes",
    "description": "A fantasy-themed set with warriors, mages, and rogues",
    "visibility": "public",
    "isDefault": false,
    "metadata": {
      "theme": "fantasy"
    },
    "characterCount": 5
  }
]
```

### Get a Specific Character Set

Returns details about a specific character set.

**Endpoint:** `GET /character-sets/:id`

**Parameters:**
- `id` (path parameter) - UUID of the character set

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
  "characterCount": 8
}
```

**Error Responses:**
- `404 Not Found` - Character set not found

### Get Characters in a Set

Returns all active characters in a specific character set, including their trait values.

**Endpoint:** `GET /character-sets/:id/characters`

**Parameters:**
- `id` (path parameter) - UUID of the character set

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Alice",
    "slug": "alice",
    "imageUrl": null,
    "summary": "Alice is a character in the classic set",
    "metadata": {},
    "isActive": true,
    "traits": [
      {
        "id": "uuid",
        "traitId": "uuid",
        "traitName": "Gender",
        "traitSlug": "gender",
        "valueText": "Female"
      },
      {
        "id": "uuid",
        "traitId": "uuid",
        "traitName": "Hair Color",
        "traitSlug": "hair-color",
        "valueText": "Blond"
      },
      {
        "id": "uuid",
        "traitId": "uuid",
        "traitName": "Wears Glasses",
        "traitSlug": "has-glasses",
        "valueText": "No"
      },
      {
        "id": "uuid",
        "traitId": "uuid",
        "traitName": "Wears Hat",
        "traitSlug": "has-hat",
        "valueText": "No"
      }
    ]
  },
  {
    "id": "uuid",
    "name": "Bob",
    "slug": "bob",
    "imageUrl": null,
    "summary": "Bob is a character in the classic set",
    "metadata": {},
    "isActive": true,
    "traits": [
      {
        "id": "uuid",
        "traitId": "uuid",
        "traitName": "Gender",
        "traitSlug": "gender",
        "valueText": "Male"
      },
      {
        "id": "uuid",
        "traitId": "uuid",
        "traitName": "Hair Color",
        "traitSlug": "hair-color",
        "valueText": "Brown"
      },
      {
        "id": "uuid",
        "traitId": "uuid",
        "traitName": "Wears Glasses",
        "traitSlug": "has-glasses",
        "valueText": "Yes"
      },
      {
        "id": "uuid",
        "traitId": "uuid",
        "traitName": "Wears Hat",
        "traitSlug": "has-hat",
        "valueText": "No"
      }
    ]
  }
]
```

**Error Responses:**
- `404 Not Found` - Character set not found

## Example Usage

### Using curl

**List all character sets:**

```bash
curl -X GET http://localhost:4000/character-sets
```

**Get a specific character set:**

```bash
curl -X GET http://localhost:4000/character-sets/{character-set-id}
```

**Get all characters in a set:**

```bash
curl -X GET http://localhost:4000/character-sets/{character-set-id}/characters
```

### Using fetch (JavaScript/TypeScript)

```typescript
// List all character sets
const response = await fetch('http://localhost:4000/character-sets');
const characterSets = await response.json();

// Get characters in a set
const charactersResponse = await fetch(
  `http://localhost:4000/character-sets/${setId}/characters`
);
const characters = await charactersResponse.json();
```

## Notes

- Only active characters (`isActive: true`) are returned by the characters endpoint
- Character sets are ordered by default status (default sets first) and then by name
- Characters are ordered by name
- All IDs are UUIDs
- Trait values are returned as part of each character object, making it easy to filter or search by traits
