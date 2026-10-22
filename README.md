# ReviHub

Reviews for movies, games and books. Sign up, add a title and rate it from 1 to 10.

Live: https://vasobi.site

React + Vite on the frontend, Express + Prisma + PostgreSQL on the backend, everything runs in Docker.

## Running locally

```bash
cp .env.example .env
docker compose up --build
```

The app is on http://localhost:3000 and the API on :3001. Migrations run on startup. Verification emails go through [Resend](https://resend.com), so put a real `RESEND_API_KEY` in `.env` if you want them to arrive.

Without Docker you need Node 24 and a Postgres. Run the API and the frontend in two terminals:

```bash
cd api && cp .env.example .env && npm install && npm run db:migrate && npm run start:dev
```

```bash
cd web && npm install && npm start
```

The frontend only ever calls `/api/...` on its own origin. In development Vite proxies it to the API, in production nginx does. That avoids CORS entirely and keeps the refresh cookie same-site.

## Tests

```bash
cd api && npm run test:run
```

These are integration tests against a real Postgres that Testcontainers starts in Docker, so Docker has to be running.

## A few implementation details

- The access token lives only in memory on the client. The refresh token is in an `httpOnly` cookie, rotated on every refresh and stored hashed in the database, so logging out actually revokes it.
- New accounts confirm their email with a 6-digit code before they can log in.

## Deployment

On every push to `main`, GitHub Actions runs the tests, builds the Docker images once and pushes them to GHCR. Then it connects to the VPS over SSH, pulls those images and restarts with `docker compose up --wait`. Database migrations run in a separate one-off container before the API starts.

To roll back, re-run the deploy job of an older commit: its images are still in the registry. Migrations are not rolled back, so they have to stay compatible with the previous version of the code.

On the server, nginx sits in front of the containers: `/api` and `/uploads` go to the API, everything else to the frontend.

The workflow needs these repository secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` and `VPS_HOST_FINGERPRINT`.
