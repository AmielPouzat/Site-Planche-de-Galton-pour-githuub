# Campus 3D pedagogique

Socle de scene 3D cartoon pour construire des chapitres d'enseignement avec Three.js.

## Demarrage

Prerequis : Node.js installe.

```bash
npm run dev
```

Puis ouvrir :

```text
http://localhost:8000
```

Si le port 8000 est deja utilise, le serveur essaie automatiquement le port suivant, par exemple :

```text
http://localhost:8001
```

L'adresse exacte est affichee dans le terminal. Pour imposer un port precis :

```bash
$env:PORT=8010; npm run dev
```

## Tester

### Test automatique rapide

```bash
npm run check
```

Ce test verifie la syntaxe des fichiers JavaScript du projet.

### Test manuel dans le navigateur

1. Lancer `npm run dev`.
2. Ouvrir l'adresse affichee dans le terminal, souvent `http://localhost:8000`.
3. Verifier que le hub s'affiche avec l'ile, le portail et l'avatar-boule.
4. Deplacer l'avatar avec `W/S` ou les fleches haut/bas.
5. Tourner avec `A/D` ou les fleches gauche/droite.
6. Sauter avec `Espace`.
7. Approcher le portail "Sciences", verifier l'invite, puis appuyer sur `E`.
8. Verifier l'URL `?chapter=sciences`, puis revenir au hub par le portail.
9. Aller vers le bord de l'ile et verifier la zone d'avertissement puis la teleportation.

## Etat actuel

- Hub principal fonctionnel.
- Chapitre `sciences` fonctionnel comme scene de test.
- Navigation entre chapitres par portail.
- Avatar-boule avec deplacement, rotation, saut maintenu et camera suiveuse.
- Ile circulaire cartoon avec chemins, reliefs, bordure visible et teleportation de securite.
- Collisions simples avec reliefs, batiments optionnels et portails.
- Textures procedurales mises en cache.

Voir [TASK.md](TASK.md) pour l'avancement detaille et les prochaines taches.

## Structure

```text
site_3d/
|-- index.html
|-- package.json
|-- README.md
|-- TASK.md
|-- assets/
|   `-- textures/
|       `-- Textures.js
|-- js/
|   |-- buildings/
|   |   |-- Building.js
|   |   `-- CityGenerator.js
|   |-- car/
|   |   |-- Car.js
|   |   `-- CarController.js
|   |-- core/
|   |   |-- CollisionSystem.js
|   |   `-- Theme.js
|   |-- scenes/
|   |   `-- ChapterTemplate.js
|   |-- world/
|   |   `-- World.js
|   `-- main.js
`-- scripts/
    |-- check-syntax.js
    `-- dev-server.js
```

## Creer un chapitre

1. Ouvrir `js/scenes/ChapterTemplate.js`.
2. Dupliquer le bloc `sciences`.
3. Modifier `id`, `title`, `subtitle`, `spawn`, `world` et `scene.portals`.
4. Ajouter un portail vers ce chapitre dans le bloc `default`.
5. Tester avec une URL comme :

```text
http://localhost:8000/?chapter=sciences
```

Les futurs contenus de cours devront aller dans `scene.learningObjects`.
