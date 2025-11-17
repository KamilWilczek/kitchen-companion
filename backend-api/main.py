from app.routers import auth, recipe, shopping_list, tags
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


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


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(recipe.router, prefix="/recipes", tags=["recipes"])
app.include_router(shopping_list.router, prefix="/shopping-list", tags=["shopping"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])
