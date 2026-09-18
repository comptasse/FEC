# FEC

[![Licence AGPL-3.0](https://img.shields.io/badge/licence-AGPL--3.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org/)

Outil open source de validation de **Fichiers des Écritures Comptables** (FEC), conforme à l'[article A47 A-1 du Livre des procédures fiscales](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000027804775/).

L'ensemble du traitement est effectué **localement dans le navigateur** : aucune donnée n'est transmise à un serveur.

## Fonctionnalités

- Validation de fichiers FEC au format texte tabulé (`.txt`) et XML (`.xml`)
- 25 contrôles de conformité : structure, colonnes, formats, cohérence comptable
- Distinction erreurs / avertissements avec localisation (ligne, champ)
- Traitement 100% local, gratuit et sans inscription

### Contrôles effectués

| # | Contrôle | Sévérité |
|---|----------|----------|
| 1 | Nom de fichier (`{SIREN}FEC{AAAAMMJJ}`) | Erreur |
| 2 | Présence de l'en-tête | Erreur |
| 3 | Ordre des 18 colonnes obligatoires | Erreur |
| 4 | Nombre minimum de colonnes (18) | Erreur |
| 5 | Séparateur tabulation ou pipe | Erreur |
| 6 | Format des dates (`AAAAMMJJ`) | Erreur |
| 7 | Format numérique (virgule décimale) | Erreur |
| 8 | CompteNum (3 premiers caractères numériques) | Erreur |
| 9 | Champs obligatoires non vides | Erreur |
| 10 | Présence Débit/Crédit ou Montant/Sens | Erreur |
| 11 | Valeurs du champ Sens (`D`, `C`, `+1`, `-1`) | Erreur |
| 12 | Validité calendaire des dates | Erreur |
| 13 | Fichier non vide | Erreur |
| 14 | Encodage (ASCII, ISO-8859-15, UTF-8) | Avertissement |
| 15 | Ordre chronologique (ValidDate) | Avertissement |
| 16 | Séquence continue des EcritureNum | Avertissement |
| 17 | Écritures d'ouverture (à-nouveaux) | Avertissement |
| 18 | Équilibre débit/crédit par écriture | Avertissement |
| 19 | Cohérence PieceDate / EcritureDate | Avertissement |
| 20 | Lignes vides dans les données | Erreur |
| 21 | Nombre de champs par ligne cohérent avec l'en-tête | Erreur |
| 22 | Point interdit comme séparateur décimal | Erreur |
| 23 | Séparateurs de milliers interdits | Erreur |
| 24 | Année des dates entre 1900 et 2099 | Avertissement |
| 25 | Débit et Crédit mutuellement exclusifs | Avertissement |

## Architecture

Monorepo pnpm avec deux packages :

```
packages/
  engine/       Moteur de validation FEC (TypeScript pur, aucune dépendance navigateur)
  website/      Interface web (React 19, Vite 8, PandaCSS, TanStack Router)
```

### `@comptasse/fec-engine`

Librairie TypeScript exportant les parseurs, validateurs et types FEC. Peut être utilisée indépendamment du site web.

```ts
import { validateFecFile } from "@comptasse/fec-engine"

const result = validateFecFile(fileContent, "123456789FEC20240101.txt")
// result.summary  -> { errors: 0, warnings: 2, total: 19, lines: 1042 }
// result.checks   -> FecCheckResult[]
```

### `@comptasse/fec-website`

Application React avec validation côté client. Le fichier est lu via `File.text()` et passé au moteur de validation directement dans le navigateur.

## Prérequis

- [Node.js](https://nodejs.org/) >= 24
- [pnpm](https://pnpm.io/) >= 10
- [Docker](https://docs.docker.com/get-docker/) et Docker Compose (pour le développement conteneurisé et le build de production)
- [just](https://github.com/casey/just) (optionnel, raccourcis de commandes)

## Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/comptasse/fec.git
cd fec

# Installer les dépendances
pnpm install

# Lancer le serveur de développement (Vite)
pnpm dev
```

Le site est accessible sur `http://localhost:5173`.

### Développement avec Docker

```bash
# Démarrer l'environnement de développement conteneurisé
just dev up
# ou directement :
./scripts/dev-up.sh

# Arrêter
just dev down
```

Le site est alors accessible sur `http://localhost:19004`.

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Démarre les serveurs de développement (tous les packages) |
| `pnpm build` | Compile tous les packages |
| `pnpm test` | Exécute les tests (vitest) |
| `pnpm check` | Lint et format avec Biome |
| `pnpm check:fix` | Corrige automatiquement les problèmes de lint/format |
| `just build` | Build Docker de production |
| `just dev up` | Environnement de développement Docker |
| `just dev down` | Arrêt de l'environnement Docker |

## Build de production

Le build de production crée une image Docker avec Nginx pour servir le site statique :

```bash
# Via just
just build

# Ou directement
docker compose -f workflows/build/compose.yml --env-file workflows/build/.env.example build
```

Variables d'environnement requises (voir `workflows/build/.env.example`) :

| Variable | Description |
|----------|-------------|
| `VITE_WEBSITE_BASE_URL` | URL publique du site |

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Langage | TypeScript 7.0 |
| Runtime | Node.js 24 |
| Frontend | React 19 |
| Bundler | Vite 8 |
| Routeur | TanStack Router |
| CSS | PandaCSS |
| Tests | Vitest |
| Lint / Format | Biome |
| Validation | Valibot |
| Gestionnaire de paquets | pnpm |
| CI/CD | GitHub Actions |
| Production | Docker, Nginx |

## Références

- [Test-Compta-Demat (DGFiP)](https://github.com/DGFiP/Test-Compta-Demat) — outil de référence de l'administration fiscale pour la validation des FEC
- [Article A47 A-1 du LPF](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000027804775/) — base légale définissant le format FEC
- [Fichiers standards des écritures comptables (impots.gouv.fr)](https://www.impots.gouv.fr/fichiers-standards-des-ecritures-comptables) — documentation officielle et schémas XSD

## Licence

[AGPL-3.0](LICENSE)
