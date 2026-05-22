# Suivi du projet Campus 3D

Ce fichier sert de memoire de projet. A chaque avancee, mettre a jour :

- la date du dernier point,
- ce qui a ete fait,
- ce qui reste a faire,
- la facon de tester.

Dernier point : 2026-05-22.

## Objectif

Construire un campus 3D pedagogique utilisable comme template de chapitres :

- un hub central,
- des chapitres accessibles par portails,
- une navigation simple,
- des objets pedagogiques ajoutes progressivement dans chaque scene.

## Fait

- Socle Three.js charge depuis `index.html`.
- Serveur local Node dans `scripts/dev-server.js`.
- Monde 3D cartoon : ile ronde, chemins, reliefs, bordure, dome leger.
- Avatar-boule jouable : avancer, reculer, tourner, sauter.
- Camera suiveuse.
- Systeme de collisions 2D au sol.
- Portails interactifs avec invite d'action.
- Navigation entre `default` et `sciences`.
- Templates de chapitres dans `js/scenes/ChapterTemplate.js`.
- Textures procedurales avec cache.
- Documentation de lancement et de test dans `README.md`.
- Test automatique de syntaxe via `npm run check`.
- Scripts `npm run check` et `npm run dev` adaptes au lancement PowerShell de ce workspace.
- Serveur local modifie pour essayer automatiquement le port suivant si `8000` est deja utilise.
- Ombre de l'avatar corrigee pendant le saut : elle reste au sol et varie en taille/opacite.
- Franchissement d'obstacles en saut : les collisions tiennent maintenant compte de la hauteur.

## Derniere verification

Verification du 2026-05-22 :

- `npm run check` : OK, 12 fichiers JavaScript verifies.
- `npm run dev` : OK, serveur local lance sur `http://localhost:8000`.
- `http://localhost:8000` : OK, reponse HTTP 200.
- `http://localhost:8000/?chapter=sciences` : OK, reponse HTTP 200.
- Verification visuelle navigateur : encore a faire manuellement, ou avec un outil navigateur si disponible.
- Correction ombre saut : `npm run check` OK, verification visuelle a faire en rechargeant le navigateur.
- Correction franchissement obstacles : `npm run check` OK, verification visuelle a faire en sautant par-dessus un relief ou une base de portail.

Note : si `npm run dev` indique `EADDRINUSE`, cela veut dire qu'un serveur utilise deja le port demande. Le script essaie maintenant les ports suivants automatiquement quand aucun `PORT` precis n'est impose.

## A tester regulierement

Avant de continuer le developpement :

```bash
npm run check
npm run dev
```

Puis verifier dans le navigateur :

- le hub s'affiche sans ecran noir,
- l'avatar se deplace correctement,
- le saut fonctionne,
- les collisions bloquent les reliefs et portails,
- le portail "Sciences" change bien de chapitre,
- le portail de retour revient au hub,
- l'interface reste lisible en desktop et mobile,
- le bord de l'ile teleporte correctement l'avatar.

## Reste a faire

Priorite haute :

- Ajouter un vrai premier objet pedagogique dans `learningObjects`.
- Definir le format des objets pedagogiques : texte, quiz, image, modele 3D, interaction.
- Afficher une interface de contenu quand l'avatar interagit avec un objet.
- Ajouter au moins un deuxieme chapitre pour valider que le systeme scale au-dela de `sciences`.

Priorite moyenne :

- Remplacer le chargement Three.js CDN par une dependance locale ou documenter clairement le besoin d'internet.
- Ajouter des tests navigateur automatises pour detecter ecran noir, erreurs console et navigation portail.
- Ajouter un mode mobile utilisable, ou au minimum des controles tactiles.
- Ameliorer l'accessibilite des textes et invites.
- Sauvegarder l'etat du chapitre courant si necessaire.

Priorite basse :

- Renommer les classes `Car` / `CarController` vers des noms plus proches de l'avatar actuel.
- Ajouter une petite carte ou un indicateur de direction.
- Ajouter sons et effets visuels pour les portails.
- Ajouter des variations visuelles par chapitre.

## Notes techniques

- Le projet n'a pas encore de depot Git initialise dans ce dossier.
- Le navigateur doit pouvoir charger Three.js depuis le CDN actuel.
- Le serveur local sert les fichiers statiques depuis la racine du projet.
- Les accents dans certains anciens fichiers peuvent apparaitre mal encodes ; garder les nouveaux fichiers en ASCII tant que l'encodage global n'est pas nettoye.
