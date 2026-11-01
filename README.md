# Portfolio — Hugo Chretien

Portfolio statique en HTML, CSS et JavaScript, prêt à être publié sur GitHub Pages.

## Prévisualisation locale

Sous Windows, depuis ce dossier :

```powershell
.\local.ps1
```

Puis ouvrir [http://localhost:4180](http://localhost:4180).

Si Node.js est installé, la même commande est disponible via :

```powershell
npm run local
```

Pour utiliser un autre port :

```powershell
.\local.ps1 -Port 8080
```

## Publication GitHub Pages

Le site ne nécessite aucune compilation. Au premier déploiement, lancer :

```powershell
.\deploy.cmd
```

Le script demande l’URL du dépôt GitHub vide, initialise Git, crée le commit et publie la branche `main`. Pour les déploiements suivants, relancer simplement la même commande.

Il est aussi possible de préciser l’URL dès le lancement :

```powershell
.\deploy.cmd -RepoUrl https://github.com/utilisateur/portfolio.git
```

Si GitHub CLI est installé et connecté, le script configure également GitHub Pages. Sinon, il affiche le lien et les quatre clics nécessaires pour activer une première fois la publication depuis la branche `main` et le dossier racine (`/`).
