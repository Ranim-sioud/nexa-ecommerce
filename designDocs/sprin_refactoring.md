## Refactoring the System to be native cloud app appliance

### Todo:
- Inspect the project (Build with MERN Stack)
- Generate Dockerfiles and a docker-compose manifest to containerize the system (backend, frontend, database)
- Verify Sequelize migrations & seeders and provide a one‑shot `initial_db` script that
  runs every migration and seed; integrate this script into the Docker setup
- Write backend tests (unit, integration, end‑to‑end) using Jest and provide CI
  scripts to execute them
- Reorganize backend sources and tests to avoid import path issues; choose and
  enforce a single module system (CommonJS) and update `package.json` accordingly
- Ensure environment variable management (.env.example + dotenv) works in all
  environments

### Breakdown ToDos in more sure steps
- I have postgres native win service running
- I will boost backend and frontend

---

### Detailed sprint action items
1. **Project inspection** – walk through `backend/src` and client application to
   understand the current MERN structure, dependencies, and startup scripts.
2. **Module system audit** – the backend code is already written as ES modules
   (`import`/`export`) while Sequelize migrations use CommonJS (`.cjs`).
   `package.json` declares `"type": "module"`, so Node treats `.js` as ESM and
   allows the mix. Rather than converting several hundred files to CommonJS, we
   will **keep ESM for now** and change the migration/seed tooling later if we
   ever need pure CommonJS, or rename them to `.mjs`/use Babel.  This satisfies
   the “keep code in JS” requirement while avoiding a large rewrite.
3. **Database migration tooling** – confirm existing files under
   `backend/migrations` and `backend/seeders`, then script a utility (e.g.
   `backend/scripts/initial_db.js`) invoking `sequelize-cli`.
4. **Docker setup** – we’ve now added concrete artifacts:
   * `backend/Dockerfile` (standard Node 20 alpine build)
   * `Ecommerce/Dockerfile` (multi‑stage Vite build + nginx static server)
   * top‑level `docker-compose.yml` which defines services for `postgres`,
     `backend` and `frontend`.  It maps ports (4001, 3000), defines a
     `postgres-data` volume, sets environment variables and mounts the
     backend source folder for live reload (`npm run dev`).
   Running `docker-compose up --build` should start the full stack in
   development; for production the volume mounts can be removed and `command`
   changed to `npm start`.
5. **Testing infrastructure** – install Jest (already in dev deps?), configure
   `jest.config.js`, add sample tests for controllers and models.  Establish
   commands `npm run test:unit`, `test:int`, `test:e2e`.
6. **Reorganization** – move existing backend code into a clean `src/` layout and
   create a parallel `__tests__/` folder.  Adjust imports and update the
   `main` entry point if needed.
7. **CI/automation** – if applicable, add scripts to `package.json` for Docker
   build, database bootstrapping, and test runs; plan for GitHub Actions or
   similar later.
8. **Documentation** – update README and design docs with instructions for
   running locally, in Docker, and executing tests.

These steps form the sprint plan; I'll start with the **project inspection**
right now.