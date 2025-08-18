from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import recipe, shopping_list, tags


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(recipe.router, prefix="/recipes", tags=["recipes"])
app.include_router(shopping_list.router, prefix="/shopping-list", tags=["shopping"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])