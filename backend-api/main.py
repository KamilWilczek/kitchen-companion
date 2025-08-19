from fastapi import FastAPI
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from sqlalchemy import select
from app.core.db import get_db, SessionLocal
from app.models.user import User
from fastapi.middleware.cors import CORSMiddleware

from app.routers import recipe, shopping_list, tags

#######
# TODO: Remove after introducing users
DEMO_USER_ID = "demo-user"

def ensure_demo_user():
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.id == DEMO_USER_ID))
        if not user:
            db.add(User(id=DEMO_USER_ID, email="demo@example.com"))
            db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_demo_user()
    yield


# app = FastAPI()
app = FastAPI(lifespan=lifespan)
#########

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping():
    return {"ok": True}


app.include_router(recipe.router, prefix="/recipes", tags=["recipes"])
app.include_router(shopping_list.router, prefix="/shopping-list", tags=["shopping"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])