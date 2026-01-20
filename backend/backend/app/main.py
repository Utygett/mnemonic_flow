from fastapi import FastAPI, APIRouter
from app.api.routes import cards, groups
from app.api.routes import auth
from starlette.middleware.cors import CORSMiddleware
from app.api.routes import decks, stats
from app.db.init_db import init_db
from app.core.version import __version__

app = FastAPI(title="Flashcards API", version=__version__)

init_db()

origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

api.include_router(cards.router,  prefix="/cards",  tags=["cards"])
api.include_router(groups.router, prefix="/groups", tags=["groups"])
api.include_router(auth.router,   prefix="/auth",   tags=["auth"])
api.include_router(decks.router,  prefix="/decks",  tags=["decks"])
api.include_router(stats.router,  prefix="/stats",  tags=["stats"])

app.include_router(api)

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/version")
def version_check():
    """Возвращает текущую версию приложения."""
    return {"version": __version__}
