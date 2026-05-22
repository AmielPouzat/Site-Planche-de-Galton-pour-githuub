# pouzat.fr

Site personnel recupere depuis le dossier `www` de l'hebergement OVH.

## Structure

```text
site_3d/
|-- www/        site public actuel
|-- www/3D/     experience Campus 3D
|-- scripts/    outils locaux
`-- package.json
```

## Tester localement

```bash
npm run check
npm test
npm run dev
```

`npm run dev` lance le serveur local depuis `www/`.
`npm run check` verifie la syntaxe JavaScript.
`npm test` verifie les fichiers critiques, les liens locaux, la page CV et le routage attendu du serveur local.

Pour lancer les deux controles d'un coup :

```bash
npm run verify
```

Ouvrir l'adresse affichee dans le terminal, souvent :

```text
http://localhost:8000
```

L'espace 3D local est disponible ici :

```text
http://localhost:8000/3D/
```

Pages principales :

- `http://localhost:8000/`
- `http://localhost:8000/atelier`
- `http://localhost:8000/cv`
- `http://localhost:8000/generateur`
- `http://localhost:8000/interpolation`
- `http://localhost:8000/galton`
- `http://localhost:8000/coffre`
- `http://localhost:8000/chat`
- `http://localhost:8000/3D/`

## Publication OVH

Le dossier `www/` correspond a la racine publique du site OVH.
L'espace 3D doit donc se trouver dans `www/3D/` pour etre visible a l'adresse `/3D/`.

Avant publication :

1. tester localement,
2. verifier les liens,
3. faire une sauvegarde,
4. envoyer seulement les fichiers modifies vers OVH.

Le fichier `www/.htaccess` force le passage en HTTPS sur OVH.
Il sert aussi les pages avec des URLs sans `.html`, par exemple `/cv` ou `/atelier`.

## Git

Le depot Git reste volontairement initialise a la racine du projet.
Il suit donc tout le site public, y compris l'espace 3D dans `www/3D/`.

Ne cree pas de depot Git imbrique dans `www/3D/` : Git traiterait alors la scene 3D comme un sous-projet separe, ce qui complique les sauvegardes et les commits.

Apres le nettoyage, Git peut afficher la suppression de l'ancien dossier `3D/` et l'ajout de `www/3D/`.
C'est normal : le contenu 3D a ete deplace vers son emplacement public.
Pour enregistrer cette nouvelle structure :

```bash
git add -A
git commit -m "Clean 3D site structure"
```

Si Git affiche `dubious ownership` dans Codex, lancer cote utilisateur Windows :

```bash
git config --global --add safe.directory C:/Users/amiel/Documents/Codex/site_3d
```
