# Projet pouzat.fr

Memo pour recuperer, modifier et remettre en ligne le site `pouzat.fr`.

## Objectif

Faire evoluer `pouzat.fr` vers un site utile au quotidien, en travaillant d'abord en local dans ce dossier, puis en publiant uniquement quand c'est verifie.

## Regle de securite

Ne jamais coller ici les mots de passe OVH, FTP, SFTP, SSH, base de donnees ou email.

On peut noter les noms de serveurs et utilisateurs si besoin, mais pas les secrets.

## Recuperer les fichiers du site

### Option recommandee : SFTP avec FileZilla ou WinSCP

Dans l'espace client OVHcloud :

1. Aller dans `Web Cloud`.
2. Ouvrir l'hebergement lie a `pouzat.fr`.
3. Chercher les acces `FTP / SFTP / SSH`.
4. Recuperer :
   - l'hote ou serveur FTP/SFTP,
   - l'identifiant FTP/SFTP,
   - le port,
   - le dossier racine du site, souvent `www/`.
5. Si le mot de passe est inconnu, le regenerer depuis OVH.
6. Se connecter avec FileZilla ou WinSCP.
7. Telecharger tout le contenu du dossier du site vers :

```text
C:\Users\amiel\Documents\Codex\site_3d\pouzat.fr\remote-copy
```

### Si le site utilise WordPress ou un CMS

Il faut recuperer deux choses :

- les fichiers du site via FTP/SFTP,
- la base de donnees via OVH/phpMyAdmin ou un export SQL.

Sans la base de donnees, une copie WordPress ne contient pas les pages, articles, options et utilisateurs.

## Organisation locale proposee

```text
site_3d/
|-- pouzat.fr/
|   |-- remote-copy/     copie brute telechargee depuis OVH
|   |-- working/         version modifiee localement
|   |-- backups/         archives avant publication
|   `-- notes.md         decisions et idees du site
```

La copie `remote-copy` sert de reference. Les modifications se font dans `working`.

## Mettre a jour le site

1. Faire une sauvegarde avant toute publication.
2. Modifier la version locale.
3. Tester localement.
4. Envoyer seulement les fichiers modifies vers le dossier distant du site.
5. Verifier `https://pouzat.fr`.

Important : ne pas supprimer des fichiers distants si on n'est pas certain de leur role.

## Prochaines actions

- Identifier si `pouzat.fr` est un site statique, WordPress, ou autre CMS.
- Recuperer les fichiers en local.
- Faire une sauvegarde zip de la premiere copie.
- Lister les pages et fonctions existantes.
- Decider ce que le site doit devenir : tableau de bord perso, portail familial, portfolio, outils du quotidien, notes, liens, agenda, etc.

## Etat local

- Dossier `pouzat.fr/remote-copy` cree pour la copie brute OVH.
- Dossier `pouzat.fr/working` cree pour la version modifiee.
- Dossier `pouzat.fr/backups` cree pour les sauvegardes.
- Fichier `pouzat.fr/notes.md` cree pour les observations et decisions.
