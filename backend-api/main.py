from app.core.config import settings
from app.routers import account, auth, categories, recipe, shopping_lists, suggestions, tags
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.RATE_LIMIT_ENABLED,
)
app = FastAPI(
    docs_url="/docs" if settings.is_dev else None,
    redoc_url="/redoc" if settings.is_dev else None,
)


def _handle_rate_limit(request: Request, exc: Exception) -> Response:
    assert isinstance(exc, RateLimitExceeded)
    return _rate_limit_exceeded_handler(request, exc)


app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _handle_rate_limit)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping():
    return {"ok": True}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(categories.router, prefix="/categories", tags=["categories"])
app.include_router(recipe.router, prefix="/recipes", tags=["recipes"])
app.include_router(shopping_lists.router, prefix="/shopping-lists", tags=["shopping"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])
app.include_router(account.router, prefix="/account", tags=["account"])
app.include_router(suggestions.router, prefix="/suggestions", tags=["suggestions"])
