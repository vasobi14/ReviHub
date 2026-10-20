# Demo seed data

Start PostgreSQL and the API using the development Compose stack:

```bash
docker compose up --build -d
```

Then install the seed script dependencies and run it:

```bash
cd tests
npm install
npx tsx seed.ts
```

The script creates 15 users, 40 works, and up to 300 reviews through the API.
Each run creates new random users and may add more works and reviews.