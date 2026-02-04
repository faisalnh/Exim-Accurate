# Self-Host Guide (Docker)

This guide explains how to run Exima as a self-hosted service with Docker.

## Prerequisites
- Docker + Docker Compose
- Git

## Quick Setup
1) Clone the repository.
2) Copy `.env.example` to `.env` and fill the required values:
   - `NEXTAUTH_URL` (your domain or `http://localhost:5758`)
   - `NEXTAUTH_SECRET` (strong random string)
   - `ACCURATE_APP_KEY`, `ACCURATE_SIGNATURE_SECRET`,
     `ACCURATE_CLIENT_ID`, `ACCURATE_CLIENT_SECRET`,
     `ACCURATE_REDIRECT_URI`
3) Build and run the stack:
```bash
docker compose up -d --build
```
4) Apply database schema:
```bash
docker compose exec app npm run db:push
```
5) Open the app at `http://localhost:5758` and complete Accurate OAuth.

## Notes
- Update `NEXTAUTH_URL` to your public domain in production.
- PostgreSQL data is persisted in the `postgres_data` volume.
- To stop the stack: `docker compose down`
