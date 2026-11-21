# CHOMA TECH

Plateforme CHOMA TECH : site vitrine + boutique + espace client (`frontend/`), back-office
d'administration (`Administration/`) et API (`backend/`, ASP.NET Core 10 + PostgreSQL).

## Démarrage rapide avec Docker (recommandé)

**Prérequis : uniquement [Docker Desktop](https://www.docker.com/products/docker-desktop/).**
Ni .NET, ni Node.js, ni PostgreSQL ne sont nécessaires sur la machine.

```bash
# 1. (facultatif) adapter les réglages
cp .env.example .env          # Windows PowerShell : Copy-Item .env.example .env

# 2. construire et lancer
docker compose up -d --build
```

Le premier lancement prend quelques minutes (téléchargement des images, compilation). Ensuite :

| Application | Adresse |
|---|---|
| Site client (vitrine, boutique, espace client) | http://localhost:5173 |
| Administration | http://localhost:5174 |
| Base PostgreSQL (pgAdmin, DBeaver…) | `localhost:5433`, base/utilisateur `chomatech`, mot de passe `chomatech-dev` |

**Connexion à l'administration** : `admin@chomatech.local` / `Admin-Chomatech-2026`
(valeurs de `ADMIN_EMAIL` / `ADMIN_PASSWORD` dans `.env`). Ce compte est créé automatiquement au
premier démarrage, seulement si la base ne contient encore aucun administrateur.
👉 Changez ce mot de passe après la première connexion.

### Commandes utiles

```bash
docker compose ps                 # état des conteneurs
docker compose logs -f backend    # logs de l'API (liens "mot de passe oublié" sans Brevo)
docker compose up -d --build      # reconstruire après une modification du code
docker compose down               # arrêter (les données sont conservées)
docker compose down -v            # arrêter ET effacer base + images téléversées (repartir de zéro)
```

### Comment c'est organisé

```
navigateur ──► site (nginx :5173) ──┐
                                    ├──► /api, /uploads ──► backend (.NET :8080) ──► db (PostgreSQL 18)
navigateur ──► admin (nginx :5174) ─┘
```

- Chaque front est servi par nginx, qui relaie `/api` et `/uploads` vers l'API : tout est sur la
  **même origine**, sans configuration CORS. L'API n'est pas exposée directement sur la machine.
- La session est un cookie `HttpOnly` (jamais lisible par JavaScript).
- La structure de la base (sans aucune donnée) est dans `database/init/01-schema.sql`, appliquée
  automatiquement au **premier** démarrage (volume vide). Après une modification du schéma,
  `docker compose down -v` puis `up` pour la réappliquer (⚠️ efface les données du conteneur).
- Les images téléversées depuis l'admin sont conservées dans le volume Docker `uploads`.

### Fonctionnalités facultatives (`.env`)

- **Emails (Brevo)** : `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (expéditeur validé dans Brevo),
  `BREVO_NEWSLETTER_LIST_ID`. Sans clé, aucun email ne part : les liens de réinitialisation de mot
  de passe s'affichent dans `docker compose logs backend`.
- **Paiements (SasPay)** : `SASPAY_API_KEY` active le paiement ; configurez aussi `SASPAY_WEBHOOK_SECRET`
  avec la valeur déclarée côté SasPay pour confirmer les paiements par webhook. `SITE_URL` doit
  correspondre au domaine public du site afin que les liens de retour/paiement soient corrects.
- **Connexion Google / Facebook** : `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
  (puis `docker compose up -d --build` : les identifiants publics sont intégrés au build du site).

> Cette configuration Docker est prévue pour le **développement et la démonstration** (http,
> mode Development). Pour une mise en production : HTTPS obligatoire, `ASPNETCORE_ENVIRONMENT=Production`,
> `Cors__AllowedOrigins__*` en `https://`, `AllowedHosts` renseigné, `JWT_KEY` et mots de passe forts
> (l'API refuse de démarrer en production si la configuration est trop ouverte).

## Développement sans Docker

Prérequis : .NET SDK 10, Node.js 22, PostgreSQL 18 (structure : `database/init/01-schema.sql`).

```bash
# API (http://localhost:5016) — secrets locaux via dotnet user-secrets
cd backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=Chomatech;Username=postgres;Password=..."
dotnet user-secrets set "Jwt:Key" "une-cle-aleatoire-d-au-moins-32-caracteres"
dotnet run

# Site client (http://localhost:5173) et administration (http://localhost:5174)
cd frontend && npm install && npm run dev
cd Administration && npm install && npm run dev
```

Dans `frontend/` et `Administration/`, copier `.env.example` en `.env` (adresse de l'API : `VITE_API_URL=http://localhost:5016`).

## Tests

```bash
dotnet test backend.Tests    # 40 tests d'intégration de l'API (PostgreSQL requis)
```

Les tests utilisent une base dédiée `chomatech_test`, recréée à chaque lancement (la base de
l'application n'est jamais touchée).
"# Chomatech" 
