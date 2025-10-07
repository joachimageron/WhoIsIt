# Phase 2 – Schémas de données & gestion des grilles

## Objectifs

- Mettre en place un modèle de données cohérent et partagé entre backend et frontend pour représenter les grilles du jeu.
- Formaliser un registre versionné de grilles permettant d’en ajouter ou d’en modifier sans redéployer l’application.
- Préparer l’infrastructure Postgres (tables, migrations, seed) afin de consommer les données en production comme en local.
- Garantir la qualité des données via des validations automatiques et des tests ciblés.

## Livrables clés

- Package partagé `packages/game-data` exportant les types TypeScript (`Grid`, `Character`, `Attribute`, `SuggestedQuestion`) et un registre des grilles disponibles.
- Fichiers de données (`*.ts` ou `*.json`) par grille, versionnés et documentés, avec prise en charge future des traductions.
- Schéma Postgres détaillé (migrations initiales) couvrant `grids`, `characters`, `attributes`, `grid_attributes`, `suggested_questions`.
- Script de seed synchronisant le contenu du package de données avec la base Postgres.
- Script de validation (`pnpm data:check`) vérifiant l’unicité des identifiants, la cohérence des attributs et la complétude des métadonnées.
- Documentation dans `README.md` expliquant comment ajouter une nouvelle grille et exécuter les scripts associés.

## Portée fonctionnelle

- Gestion des grilles du mode 1v1 (structure, personnages, attributs, suggestions de questions).
- Gestion de localisations basiques (champ `defaultLocale`, préparation pour variantes futures).
- Absence assumée d’images : utilisation de `imageKey` comme identifiant réservé.
- Hors périmètre : interface d’administration, ajout d’images, gestion des spectateurs.

## Architecture des données

### Types partagés

- `Grid`: identifiant, métadonnées, bornes de joueurs, locale par défaut, tags globaux.
- `Character`: identifiant unique, nom, `imageKey`, liste d’attributs `{ key, label, value }`.
- `Attribute`: dictionnaire normalisé pour permettre des suggestions à partir des tags.
- `SuggestedQuestion`: structure simple `{ id, label, attributeKey? }` pour lier une suggestion à un attribut.

Le package `packages/game-data` fournira :

- Les types TypeScript.
- Un registre `grids` (objet ou tableau) listant les grilles disponibles.
- Des helpers pour charger une grille par identifiant et exposer ses suggestions.
- Des validations runtime légères (ex. via `zod`) pour s’assurer que les fichiers data respectent les types.

### Schéma Postgres cible

| Table               | Champs principaux                                                                                                 |
|---------------------|--------------------------------------------------------------------------------------------------------------------|
| `grids`             | `id`, `name`, `description`, `theme`, `default_locale`, `min_players`, `max_players`, timestamps                   |
| `characters`        | `id`, `grid_id`, `name`, `image_key`                                                                               |
| `attributes`        | `id`, `grid_id`, `key`, `label`, `value`                                                                           |
| `grid_attributes`   | `grid_id`, `attribute_key`, `tag` (pour suggestions globales)                                                      |
| `suggested_questions` | `id`, `grid_id`, `label`, `attribute_key`, `order`                                                                 |

Les tables seront reliées par des clés étrangères, avec indexes sur `grid_id` pour optimiser les requêtes de lecture.

## Flux de création / mise à jour d’une grille

1. Créer un fichier de grille (ex. `packages/game-data/src/grids/classic.ts`).
2. Définir les métadonnées (`id`, `name`, `theme`, limites de joueurs, `defaultLocale`, `tags`).
3. Lister les personnages (`characters`) et leurs attributs.
4. Ajouter les suggestions (`suggestedQuestions`) en respectant l’unicité des identifiants.
5. Lancer `pnpm data:check` pour valider le fichier.
6. Lancer le script de seed pour répercuter la grille dans Postgres.
7. Vérifier dans l’application de démonstration (outil CLI ou page temporaire) que la grille est accessible.

## Scripts & automatisations

- `pnpm data:check` : exécute les validations (unicité des IDs, attributs obligatoires, correspondance des clés).
- `pnpm data:seed` : importe les grilles du package dans Postgres. Utilise une transaction et gère l’upsert.
- `pnpm data:list` : affiche les grilles connues avec leur statut (en base / en fichiers).

Ces scripts seront exposés depuis la racine du monorepo et pourront être appelés par le CI.

## Validation & qualité

- Tests unitaires sur le package `game-data` pour vérifier la structure générée par les fichiers data.
- Tests d’intégration côté backend : après seed, lecture des tables et comparaison avec les fichiers source.
- Vérifications lint/format (`pnpm lint`) intégrant les schémas de données.
- Ajout d’un hook (pre-commit ou CI) exécutant `pnpm data:check`.

## Prochaines étapes (préparation phase 3)

- Documenter les points d’intégration attendus par le backend Nest (services de lecture des grilles).
- Identifier les endpoints nécessaires (`GET /grids`, `GET /grids/:id`) et la manière dont ils consommeront le package `game-data`.
- Préparer une structure de dossiers dans `apps/backend` pour accueillir les modules `Grids` et `GameSessions` basés sur les données Phase 2.
