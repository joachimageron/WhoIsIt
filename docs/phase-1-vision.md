# Phase 1 – Vision & cadrage produit

## Objectifs

- Poser une vision claire et simple de l’adaptation numérique de « Qui est-ce ? ».
- Garantir que les futures phases disposent d’un cadre fonctionnel cohérent.
- Concevoir une expérience mobile-first ensuite étendue au desktop.
- Aligner l’expérience utilisateur avec les contraintes techniques (Postgres, Zustand, Socket.IO, MJML).

## Modes de jeu ciblés

- **Duel en ligne (1v1)** : mode principal avec synchronisation temps réel, chat et questions partagées.
- **Ouverture aux spectateurs** (option future) : possibilité pour des amis de suivre la partie en observateur, à planifier après MVP.

## Parcours utilisateur cible

1. Arrivée sur la page d’accueil, aperçu des grilles disponibles.
2. Création de compte via email + mot de passe (ou connexion si compte existant).
3. Réception d’un email de vérification et validation de l’adresse.
4. Retour sur l’application : sélection d’une grille et création d’une nouvelle partie ou rejoint via un lien/ID.
5. Attribution automatique d’un personnage secret par joueur et affichage de la grille.
6. Les joueurs se posent des questions (texte libre) et utilisent le chat temps réel.
7. Lorsqu’un joueur est confiant, il propose une réponse finale (à définir en Phase 2/3) et la partie se conclut.

## Contraintes fonctionnelles clés

- Interface mobile-first, optimisée d’abord pour smartphones puis déclinée sur desktop.
- Les grilles doivent être configurables sans redéploiement (données versionnées + seed base si nécessaire).
- Les images de personnages seront ajoutées ultérieurement ; prévoir des placeholders.
- Authentification obligatoire pour jouer en ligne afin d’assurer la vérification d’email.
- Historique des questions et du chat persisté côté serveur pour pouvoir recharger une partie.
- Tableau de bord utilisateur pour consulter l’historique des parties, positionné comme évolution secondaire.

## Structure des grilles (premier jet)

- `grid` (niveau racine)
  - `id` (slug unique)
  - `name`
  - `description`
  - `theme` (ex. « Classique », « Héros », « Animaux »)
  - `minPlayers` / `maxPlayers` (par défaut 2)
  - `defaultLocale` (pour gérer les traductions futures)
  - `tags` globaux (permettent d’afficher des suggestions communes)
  - `characters` (tableau)
    - `id`
    - `name`
    - `imageKey` (chemin ou identifiant d’image, vide tant que non fourni)
    - `attributes` (liste d’objets `{ key, label, value }` où `value` est textuel pour rester libre)
  - `suggestedQuestions` (tableau de modèles « prêts à l’emploi », facultatif)

- Stockage prévu en modules TypeScript/JSON pour être importés côté backend et seedé dans Postgres (`grids`, `characters`, `attributes`, `grid_attributes`).

## Mécanique des questions et suggestions

- Chaque joueur saisit librement sa question (champ texte simple).
- Suggestions affichées dans un panneau secondaire : elles proviennent des tags et attributs déclarés dans la grille.
- Une suggestion cliquée préremplit le champ mais n’envoie pas automatiquement la question.
- La réponse (Oui / Non / Je ne sais pas) est fournie manuellement par le joueur ciblé.
- Les événements question/réponse sont diffusés via Socket.IO et conservés en base pour relecture.
- Aucun système de modération automatique n’est prévu pour le chat ni pour les questions dans le MVP.

## Besoins e-mail identifiés

- **Vérification d’adresse** : envoi après inscription, lien avec token signé (expiration courte).
- **Bienvenue** : message envoyé après confirmation, résumant les prochaines étapes et rappelant le lien vers la sélection de grilles.
- **Rappel de partie** (optionnel, post-MVP) : notification lorsqu’un adversaire lance une partie à laquelle l’utilisateur est invité.
- Templates produits en MJML, compilés côté backend avant envoi et diffusés via un SMTP maison. Les variables dynamiques devront inclure prénom/alias, liens d’action et informations de contact.
