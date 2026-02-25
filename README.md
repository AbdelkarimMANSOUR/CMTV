# Cabinet Smart

Application web complète pour la gestion d’un cabinet médical:

- Patients + rendez-vous (CRUD, statuts, filtres, vues).
- TV salle d’attente (contenu visuel, file d’attente, audio continu).
- Réseaux sociaux + génération IA.
- Rapports IA, traçabilité, équipements LAN, landing pages.
- Profil médecin et dashboard global.

## Structure

- [`/backend`](/Users/kiko/Desktop/test/Cabinet/backend): API Express + Prisma.
- [`/frontend`](/Users/kiko/Desktop/test/Cabinet/frontend): React + Vite + Tailwind.
- [`/Source`](/Users/kiko/Desktop/test/Cabinet/Source): assets/pages annexes.

## Optimisations déjà appliquées

- Découpage du bundle frontend (`manualChunks`) pour de meilleurs temps de chargement.
- Synchronisation TV renforcée: `storage` + `BroadcastChannel` + rafraîchissement périodique.
- Stockage local des médias lourds (audio/vidéo) via IndexedDB (`localmedia://...`).
- Téléchargement direct des médias depuis TV Manager.
- `.gitignore` renforcé pour éviter d’envoyer des builds, deps, logs, secrets.

## Prérequis

- Node.js 20+ recommandé.
- npm 10+.

## Installation

```bash
cd /Users/kiko/Desktop/test/Cabinet
npm run install:all
```

## Développement

Terminal 1:

```bash
cd /Users/kiko/Desktop/test/Cabinet
npm run dev:backend
```

Terminal 2:

```bash
cd /Users/kiko/Desktop/test/Cabinet
npm run dev:frontend
```

## Vérifications avant publication

```bash
cd /Users/kiko/Desktop/test/Cabinet
npm run typecheck
npm run build
```

## Routes clés

- `/dashboard`
- `/patients`
- `/appointments`
- `/social-media`
- `/tv-manager`
- `/traceability`
- `/doctor-profile`
- `/landing`
- `/tv-display/:screen`

## Préparer et pousser vers GitHub

Dans le dossier projet:

```bash
cd /Users/kiko/Desktop/test/Cabinet
git init
git add .
git commit -m "feat: cabinet smart optimized and github ready"
git branch -M main
git remote add origin https://github.com/<ton-user>/<ton-repo>.git
git push -u origin main
```

Si le remote existe déjà:

```bash
git remote set-url origin https://github.com/<ton-user>/<ton-repo>.git
git push -u origin main
```

Le projet inclut déjà une CI GitHub Actions:

- [ci.yml](/Users/kiko/Desktop/test/Cabinet/.github/workflows/ci.yml)
- Vérifie typecheck + build frontend/backend sur `push` et `pull_request`.

## Notes

- Les médias `localmedia://` restent liés au navigateur/machine local.
- Pour partager les médias entre machines, utiliser des URLs HTTP(S) ou un stockage serveur.
