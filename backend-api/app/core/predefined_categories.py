from dataclasses import dataclass
from uuid import UUID, NAMESPACE_DNS, uuid5

from sqlalchemy import select
from sqlalchemy.orm import Session


@dataclass(frozen=True)
class PredefinedCategory:
    name: str
    icon: str

    @property
    def id(self) -> UUID:
        """Stable UUID derived from the name — same on every deployment."""
        return uuid5(NAMESPACE_DNS, f"predefined-category:{self.name}")


def seed_predefined_categories(db: Session) -> None:
    """Insert any missing predefined categories (idempotent)."""
    from app.models.category import Category  # local import to avoid circular

    existing = set(
        db.scalars(select(Category.name).where(Category.user_id.is_(None))).all()
    )
    missing = [c for c in PREDEFINED_CATEGORIES if c.name not in existing]
    if missing:
        db.add_all([
            Category(id=c.id, user_id=None, name=c.name, icon=c.icon)
            for c in missing
        ])
        db.commit()


PREDEFINED_CATEGORIES: list[PredefinedCategory] = [
    PredefinedCategory("alkohol", "🍷"),
    PredefinedCategory("art. sypkie", "🌾"),
    PredefinedCategory("bakalie i orzechy", "🥜"),
    PredefinedCategory("dania gotowe", "🍱"),
    PredefinedCategory("dom i ogród", "🏡"),
    PredefinedCategory("dziecko", "👶"),
    PredefinedCategory("elektronika", "🔌"),
    PredefinedCategory("higiena", "🧼"),
    PredefinedCategory("inne", "📦"),
    PredefinedCategory("kawa i herbata", "☕"),
    PredefinedCategory("konserwy i przetwory", "🥫"),
    PredefinedCategory("medyczne", "💊"),
    PredefinedCategory("mięso", "🥩"),
    PredefinedCategory("nabiał", "🥛"),
    PredefinedCategory("mrożonki", "🧊"),
    PredefinedCategory("oleje i tłuszcze", "🫒"),
    PredefinedCategory("owoce i warzywa", "🍎"),
    PredefinedCategory("pieczenie i dodatki", "🧁"),
    PredefinedCategory("pieczywo", "🍞"),
    PredefinedCategory("przyprawy", "🧂"),
    PredefinedCategory("ryby i owoce morza", "🐟"),
    PredefinedCategory("słodycze i przekąski", "🍬"),
    PredefinedCategory("środki czystości", "🫧"),
    PredefinedCategory("świeże zioła", "🌿"),
    PredefinedCategory("wege", "🥗"),
    PredefinedCategory("woda i napoje", "💧"),
    PredefinedCategory("zwierzęta", "🐾"),
]
