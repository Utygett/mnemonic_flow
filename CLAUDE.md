# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MnemonicFlow is a full-stack web application for flashcard-based learning and memory retention. It's a Progressive Web App (PWA) with offline support that allows users to create, study, and manage flashcards with an adaptive recall system.

**Architecture:**
- **Frontend:** React 18 + TypeScript with Vite, using Feature-Sliced Design (FSD v2) methodology
- **Backend:** FastAPI (Python) with PostgreSQL database
- **Infrastructure:** Docker Compose for development and production deployments

## Development Commands

### Using Docker Compose (Recommended)

```bash
# Development (includes hot-reload)
cd infra
docker compose -f compose.dev.yml up -d

# View logs
docker compose -f compose.dev.yml logs -f
docker compose -f compose.dev.yml logs backend --tail=50  # specific service

# Rebuild a service after code changes
docker compose -f compose.dev.yml up -d --build frontend
docker compose -f compose.dev.yml up -d --build backend
docker compose -f compose.dev.yml up -d --build  # rebuild all

# Stop services
docker compose -f compose.dev.yml down

# Stop and remove volumes (clears database)
docker compose -f compose.dev.yml down -v
```

**Note:** `docker compose` (v2) is the modern syntax. `docker-compose` (v1) also works but is deprecated.

### Pre-commit via Docker

```bash
cd infra
docker compose -f compose.pre-commit.yml run --rm pre-commit
```

Uses cached image from `ghcr.io/utygett/mnemonic_flow/pre-commit:latest` with all hooks pre-installed.

### Local Development (Without Docker)

**Backend (FastAPI):**
```bash
cd backend
pip install -r requirements.txt
# Set up .env file (see infra/.envExample.dev)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (React + Vite):**
```bash
cd frontend
npm install
npm run dev    # Runs on port 3000, proxies /api to localhost:8000
npm run build  # Production build
npm run preview  # Preview production build

# PWA assets
npm run generate-pwa-assets  # Generate PWA icons and manifest
```

### Testing

**Backend tests:**
```bash
cd backend
pytest                              # All tests
pytest backend/tests/test_security.py  # Specific file
pytest -s                           # With print() output
pytest -x                           # Stop on first failure
pytest --cov=backend/app            # With coverage (requires pytest-cov)
```

Configuration in `backend/pyproject.toml` - sets `pythonpath = "backend"` for correct imports.

**Frontend tests:**
```bash
cd frontend
npm test           # Run Vitest tests
npm run test:ui    # Run tests with UI
npm run test:coverage  # Generate coverage report
```

## Backend Testing

### Test Structure

```
backend/backend/tests/
├── conftest.py            # Pytest fixtures (db, client, auth)
├── test_security.py       # Unit tests (no DB)
├── test_user_model.py     # Integration tests (with DB)
└── ...
```

### Fixtures (conftest.py)

| Fixture | Description | Scope | Usage |
|---------|-------------|-------|-------|
| `init_database` | Creates all tables before test | function, autouse | Automatic |
| `db` | SQLAlchemy database session | function | For DB operations |
| `cleanup_db` | Truncates tables after test | function, explicit | Add `cleanup_db` param |
| `client` | FastAPI TestClient for HTTP | function | For API tests |
| `test_user` | Creates test user in DB | function | For authenticated tests |
| `auth_token` | JWT token for test_user | function | For API auth |
| `auth_headers` | Dict with Authorization header | function | For API auth |

### Test Patterns

**Unit test (no database):**
```python
# backend/tests/test_security.py
from app.core.security import hash_password, verify_password

class TestHashPassword:
    def test_hash_returns_different_values(self):
        password = "mypassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2  # Salt makes them different
```

**Integration test (with database):**
```python
# backend/tests/test_user_model.py
from app.models.user import User
from app.core.security import hash_password

class TestUserModel:
    def test_create_user(self, db, cleanup_db):
        user = User(
            username="testuser",
            email=f"test_{uuid.uuid4()}@example.com",
            password_hash=hash_password("password123"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.id is not None
        assert user.username == "testuser"
```

**API endpoint test:**
```python
def test_login_success(client, test_user):
    resp = client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()
```

### Key Configuration Details

1. **Environment variables** - Set in `conftest.py` before imports:
   - `DATABASE_URL` - defaults to local PostgreSQL
   - `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` - JWT config

2. **Model imports** - All models must be imported in `conftest.py` so `Base.metadata` knows about them for table creation

3. **init_database fixture** - Runs automatically before each test (`autouse=True`), creates tables via `Base.metadata.create_all()`

4. **cleanup_db fixture** - Must be explicitly requested as parameter, uses `TRUNCATE ... CASCADE`

5. **app.main import** - Delayed until inside `client()` fixture to avoid `init_db()` call during import

### CI/CD

**GitHub Actions** - Automated CI on Pull Requests to `main` and `develop` branches.

**Pipeline stages (in order):**

1. **`.github/workflows/validate-commits.yml`** - Validates PR metadata
   - VERSION file format (xx.xx.xx)
   - Commit messages follow Conventional Commits

2. **`.github/workflows/code-style.yml`** - Code quality checks
   - Runs pre-commit hooks on all files
   - Uses Docker registry cache for faster builds
   - Python: Black, isort, Flake8
   - TypeScript/JS: Prettier formatting
   - YAML/TOML/JSON validation

3. **`.github/workflows/build-all.yml`** - Build containers
   - Frontend image with registry cache
   - Backend image with registry cache
   - Docker Compose build validation

4. **`.github/workflows/test-all.yml`** - Run tests
   - Backend pytest tests
   - Frontend vitest tests

5. **`.github/workflows/push-images.yml`** - Push images to registry
   - Triggered on push to `main`/`develop` or manual dispatch
   - Pushes `backend`, `frontend`, `pre-commit` images to `ghcr.io/utygett/mnemonic_flow/`
   - Images used as cache for CI builds

**Docker Registry Caching:**
- Images are stored in GitHub Container Registry (ghcr.io)
- CI workflows use `--cache-from=type=registry` to speed up builds
- Pre-commit image has all hooks pre-installed and cached in layers
- Local development uses registry images as fallback if build fails

**Trigger:** Any PR targeting `main` branch

**Note:** CI uses `docker compose` (v2 syntax), not `docker-compose` (v1). Local development can use either.

### Database Migrations

```bash
cd backend
alembic upgrade head    # Apply migrations
alembic revision --autogenerate -m "description"  # Create new migration
```

## Frontend Architecture: Feature-Sliced Design (FSD v2)

The frontend strictly follows FSD v2 methodology. This is critical for understanding where code belongs and how imports work.

**Documentation reference:** `frontend/docs/fsd-contract.md` (Russian) - full architectural contract

### Layer Hierarchy (top to bottom)

```
app/         - Global infrastructure (providers, routing, styles)
pages/       - Routeable screens (Auth, Home, Study, Stats, Profile, etc.)
widgets/     - Large reusable UI blocks (main shell, navigation, PWA overlays)
features/    - User actions/use-cases (create cards, review, import/export)
entities/    - Domain models (Card, Deck, User, Group)
shared/      - Foundation (UI kit, API client, utilities, config)
```

### Layer Responsibilities

**`app/` — Global infrastructure**
- Providers (AuthProvider)
- Routing configuration (AppRouter)
- Global styles
- Entry points
- PWA/analytics integrations
- ⚠️ NOT for business domains — only infrastructure

**`pages/` — Routeable screens**
- UI pages
- Loading/error states
- Widget/feature composition
- Minimal "glue" logic
- Can contain significant code if team navigates it easily
- ❌ No page-to-page imports

**`widgets/` — Large UI blocks**
- Self-contained UI pieces (shell/layout, tab-bar, panels)
- Must be reusable OR significantly offload pages
- **Key decision:** Tab-based app layout is in `widgets/main-shell`, not `pages/main`

**`features/` — User actions (use-cases)**
- What users DO (create card, edit, login, import)
- Focused (not "everything")
- Can include: UI, validation, API calls, local state
- ❌ No feature-to-feature imports

**`entities/` — Domain models**
- Business concepts (Card, Deck, Group, User)
- Default: don't know about each other
- Connecting logic → higher layers (features/widgets/pages)

**`shared/` — Foundation**
- External world (API, env, 3rd-party)
- Basic libraries & UI-kit (no business logic)
- ❌ NO domain folders (like `shared/cards`)

### Import Rules (Critical)

**Golden Rule:** A file can only import from layers **strictly below** it.

Examples:
- `pages/*` can import from `widgets/*`, `features/*`, `entities/*`, `shared/*`
- `widgets/*` can import from `features/*`, `entities/*`, `shared/*` (NOT other widgets)
- `features/*` can import from `entities/*`, `shared/*` (NOT other features)
- `entities/*` can only import from `shared/*`

**Forbidden:**
- Page-to-page imports (e.g., `pages/home` importing `pages/study`)
- Widget-to-widget imports
- Feature-to-feature imports
- Any imports going UP the layers

**Exceptions:**
- `app/` and `shared/` are "layer=slice" — segments within these can import each other freely
- Practical compromise: `shared/` may import types from `entities/` for domain models in utilities

### Public API Pattern

Every slice must have an `index.ts` that exports its public API. **Only import through the public API.**

**Correct:**
```typescript
import { CreateCardForm } from "features/cards-create";
import { DeckCard } from "entities/deck";
```

**Forbidden (deep imports):**
```typescript
import { CreateCardForm } from "features/cards-create/ui/CreateCardForm";
```

### Standard Segments

Use these segment names consistently across all layers:

- **`ui/`** — React components (View), minimal side-effects
- **`model/`** — State, hooks, validation, business rules, selectors
- **`api/`** — Queries/mutations (at entity or scenario level)
- **`lib/`** — Slice-specific utilities (focused, not a "utils dump")
- **`config/`** — Local flags/configuration

**DO NOT create:**
- Upper-level `hooks/`, `types/`, `components/` as main segments
- Use subdirectories under `ui/` instead (e.g., `ui/hooks/`)

### Path Aliases

The `@/` alias maps to `frontend/src/` in vite.config.ts.

Use `@/` for all cross-layer imports:
```typescript
import { StudyMode } from '@/entities/card';  // ✅
import { Button } from '@/shared/ui/Button/Button';  // ✅
import { something } from '../../../shared/ui';  // ⚠️ Works but prefer @/
```

### Project-Specific Decisions

1. **No `processes` layer** — FSD `processes` is deprecated and not used
2. **Main Shell location** — `widgets/main-shell`, not `pages/main` (it's a container, not a routeable page)
3. **Temporary proxies** — Acceptable during migration, but should be removed in next PRs
4. **New code only via Public API** — No deep imports for new implementations
5. **No logic in `.tsx` files** — Business logic goes in `.ts` files within `model/` or `lib/`

### Adding New Code: Checklist

When adding new code, follow this checklist:

1. **Determine the layer:**
   - Fundamental/utility → `shared`
   - Domain concept (Card, Deck, User) → `entities/<name>`
   - User action (create, edit, login) → `features/<name>`
   - Large reusable UI block → `widgets/<name>`
   - Routeable screen → `pages/<name>`
   - Global infrastructure → `app`

2. **Choose the segment:**
   - React component → `ui/`
   - State/hooks/business logic → `model/`
   - API call → `api/`
   - Utility → `lib/`
   - Configuration → `config/`

3. **Create/update `index.ts`:**
   - Export public API through `index.ts`
   - Never import from internal paths

4. **Verify imports:**
   - Can only import from layers below
   - Use `@/` alias for cross-layer imports
   - No deep imports into internal files

**Example - Creating a "Delete Card" feature:**

```
features/
└── card-delete/
    ├── ui/
    │   └── DeleteCardButton.tsx      # Button component
    ├── model/
    │   └── useDeleteCard.ts          # Hook with API call
    ├── api/
    │   └── deleteCard.ts             # API wrapper (optional)
    └── index.ts                      # Public API export
```

```typescript
// index.ts - Public API
export { DeleteCardButton } from './ui/DeleteCardButton';
export type { DeleteCardProps } from './ui/DeleteCardButton';
```

```typescript
// Usage in pages
import { DeleteCardButton } from '@/features/card-delete';  // ✅
import { DeleteCardButton } from '@/features/card-delete/ui/DeleteCardButton';  // ❌
```

## Backend Architecture

**Structure:**
- FastAPI with automatic OpenAPI docs at `/docs` and `/redoc`
- SQLAlchemy ORM with async support
- JWT authentication with refresh token rotation
- Alembic for database migrations
- PostgreSQL database

**Key Files:**
- `app/main.py` - FastAPI application entry point
- `app/models/` - SQLAlchemy models
- `app/schemas/` - Pydantic schemas
- `app/api/` - API route handlers
- `app/core/` - Core functionality (security, config, database)
- `app/alembic/` - Database migrations

**API Routes:**
| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/version` | Get application version | No |
| `/api/auth/*` | Registration, login, token refresh | No |
| `/api/cards/*` | Card CRUD operations | Yes |
| `/api/decks/*` | Deck CRUD operations | Yes |
| `/api/groups/*` | Study group operations | Yes |
| `/api/stats/dashboard` | Dashboard statistics | Yes |

**Version Endpoint (`GET /version`):**
Returns the current application version:
```json
{"version": "0.0.99"}
```

Version is read from the `VERSION` file in the project root and is automatically injected during Docker build.

**In code:**
```python
from app.core.version import get_version
version = get_version()  # "0.0.99"
```

**Statistics Endpoint (`GET /api/stats/dashboard`):**
Returns user statistics for the dashboard:
- `cards_studied_today`: Number of cards reviewed today
- `time_spent_today`: Time spent studying today (minutes)
- `current_streak`: Consecutive days with reviews
- `total_cards`: Total cards owned by user

**Important:** When working with time calculations, note that `CardReviewHistory.interval_minutes` is the SM-2 algorithm's interval until next review, NOT study time. For actual study time, use `reviewed_at - reveal_at` (time from answer reveal to user rating).

**Documentation:** See `backend/README.md` for detailed backend documentation including testing, migrations, and environment configuration.

## Code Style & Quality

### Python (Backend)

**Pre-commit hooks** — автоматическая проверка перед коммитом:

```bash
# Install pre-commit
pip install pre-commit
cd /path/to/repo
pre-commit install

# Run on all files
pre-commit run --all-files

# Run specific hook manually
pre-commit run black --all-files
pre-commit run mypy --all-files --hook-stage manual
```

**Tools configured in `.pre-commit-config.yaml`:**
| Tool | Purpose | Config |
|------|---------|--------|
| **Black** | Code formatter | `preview` mode, 100 char line |
| **isort** | Import sorting | black-compatible profile |
| **Flake8** | Linting | via `Flake8-pyproject` |
| **mypy** | Type checking | manual stage only |

**Manual commands:**
```bash
cd backend
black .                 # Format code
isort .                 # Sort imports
flake8 .                # Check style
mypy backend/app        # Type check
```

**Configuration files:**
- `backend/pyproject.toml` — Black, isort, Flake8, mypy settings
- `.pre-commit-config.yaml` — All pre-commit hooks

### TypeScript (Frontend)

**Linting & formatting:**
```bash
cd frontend

# Lint
npm run lint            # Check
npm run lint:fix        # Fix auto-fixable issues

# Format (Prettier)
npm run format          # Format all files
npm run format:check    # Check formatting
```

**Tools:**
- **ESLint 9** — Flat config format (`eslint.config.js`)
- **Prettier** — Code formatter (`.prettierrc`)
- **typescript-eslint** — TypeScript-specific rules

**Configuration files:**
- `frontend/eslint.config.js` — ESLint flat config
- `frontend/.prettierrc` — Prettier settings

### CI/CD Integration

Code style checks run automatically in CI for all PRs to `main` and `develop`. The pipeline:

1. Validates commits → 2. Checks code style → 3. Builds containers → 4. Runs tests

**Tip:** Run `pre-commit run --all-files` locally before pushing to catch issues early.

### Manual Code Fixes

If pre-commit hooks fail and you need to fix manually:

**Python (backend):**
```bash
cd backend
pip install autopep8 autoflake

# Remove unused imports
autoflake --in-place --remove-all-unused-imports -r backend/

# Fix formatting
autopep8 --in-place --aggressive --max-line-length=100 -r backend/

# Run black for final formatting
black . --preview
```

**TypeScript/JavaScript (frontend):**
```bash
cd frontend

# ESLint auto-fix
npm run lint:fix

# Prettier formatting
npm run format
```

### SQLAlchemy Forward References

Models use `# noqa` comments for forward references — this is **intentional**, not a bug:

```python
from app.models.card_tag import CardTag  # noqa: F401 - needed for relationship
from __future__ import annotations

class Card(Base):
    # String in relationship() = forward reference (not imported yet)
    tags = relationship("CardTag", secondary=CardCardTag)  # noqa: F821
```

**Why:**
- `from __future__ import annotations` makes all type hints strings automatically
- SQLAlchemy `relationship()` uses string names for forward references
- `# noqa: F401` — import needed for SQLAlchemy mapper initialization
- `# noqa: F821` — forward reference to class not defined yet

## Environment Configuration

**Development environment template:** `infra/.envExample.dev`

Required variables:
- `SECRET_KEY` - JWT secret key
- `ALGORITHM` - JWT algorithm (typically `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` - JWT token expiration time
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` - Database credentials
- `VITE_API_URL` - API endpoint for frontend (default: `/api`)

**IMPORTANT - Docker Compose environment variables:**
- Variables in `.env` are NOT automatically passed to containers
- Each service that needs variables must explicitly list them in `compose.dev.yml` under `environment:`
- Docker Compose does NOT expand nested variables (e.g., `${POSTGRES_PASSWORD}` inside `DATABASE_URL`)
- Solution: Either use direct values in `.env` or define the full URL in compose.yml where Docker Compose can expand variables

Example compose.dev.yml:
```yaml
backend:
  environment:
    DATABASE_URL: postgresql+psycopg2://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    SECRET_KEY: ${SECRET_KEY}
    ALGORITHM: ${ALGORITHM}
    ACCESS_TOKEN_EXPIRE_MINUTES: ${ACCESS_TOKEN_EXPIRE_MINUTES}
```

## Docker & Troubleshooting

### Database Initialization

The backend uses a custom initialization approach in `entrypoint.sh`:
1. Creates tables from SQLAlchemy models using `init_db()` from `app.db.init_db`
2. Runs `alembic stamp head` to mark the database as up-to-date (bypasses broken migration chain)
3. Starts uvicorn server

**Migration chain issue:** The project has a stub migration that does nothing, followed by migrations that modify non-existent tables. The current workaround is to create tables from models and stamp migrations as applied.

### Common Issues

**1. Frontend changes not appearing:**
- Frontend is served from a built image, not hot-reloaded
- After any TypeScript/React changes, rebuild: `docker compose -f compose.dev.yml up -d --build frontend`
- Changes to source code in `frontend/src/` won't appear without rebuild

**2. Frontend build fails with "package-lock.json out of sync":**
- The Dockerfile uses `npm install` instead of `npm ci` for development flexibility
- If lock file is desynchronized, run `npm install` locally to regenerate it

**3. Backend changes not appearing:**
- Backend also uses a built image but has some Python hot-reload in dev mode
- After major changes, rebuild: `docker compose -f compose.dev.yml up -d --build backend`

**4. Nginx can't find backend container:**
- Error: "host not found in upstream 'backend'"
- Usually caused by backend failing to start due to missing environment variables or database issues

**5. Backend fails with "Field required" for SECRET_KEY/ALGORITHM:**
- Environment variables not being passed to container
- Check that all required variables are listed in `compose.dev.yml` under `environment:`

**6. Database operations from host:**
```bash
# Connect to PostgreSQL container
docker compose -f compose.dev.yml exec db psql -U flashcards_user -d flashcards

# Example: Update user email verification
docker compose -f compose.dev.yml exec db psql -U flashcards_user -d flashcards -c "UPDATE users SET is_email_verified = true;"
```

**7. Nginx config path:**
- Config is at `infra/deploy/nginx/conf.d/default.conf`
- Volume mount in compose.yml must use exact path: `./deploy/nginx/conf.d/default.conf`

## Technology Stack

**Frontend:**
- Build: Vite 6.3.5 with SWC compiler (not Babel)
- UI: Radix UI primitives + CSS Modules for component styling
- State: React hooks, react-hook-form
- Math: KaTeX for mathematical content in flashcards
- Charts: Recharts for statistics visualization
- PWA: vite-plugin-pwa with service worker caching

**Backend:**
- FastAPI with uvicorn server
- PostgreSQL 16 with SQLAlchemy 2.0
- Password hashing: bcrypt
- JWT tokens: python-jose

## Key Patterns to Follow

1. **When adding new code:** First determine which layer it belongs to based on the FSD hierarchy.

2. **When in doubt about imports:** If you need to import from a sibling layer, consider moving the shared code to a lower layer or composing at a higher layer.

3. **API calls:** Frontend API client is in `shared/api`. Each entity may have its own `api/` segment with domain-specific queries.

4. **UI components:** Start with Radix UI primitives from `shared/ui`. Only create custom components when necessary.
