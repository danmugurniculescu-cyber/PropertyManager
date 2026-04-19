import os
from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "db.sqlite"

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if DATABASE_URL:
    # Railway furnizează postgres://, SQLAlchemy necesită postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    _is_sqlite = False
else:
    engine = create_engine(
        f"sqlite:///{DB_PATH}",
        connect_args={"check_same_thread": False},
    )
    _is_sqlite = True


def get_session():
    with Session(engine) as session:
        yield session


def init_db():
    SQLModel.metadata.create_all(engine)
    if _is_sqlite:
        _migrate_sqlite()
        _cleanup_orphan_declaratie_ids()
    _seed_proprietati()


def _migrate_sqlite():
    """Adaugă coloane noi la tabele existente SQLite dacă lipsesc."""
    from sqlalchemy import text

    migrations = [
        ("rezervaraimportata", "nume_turist", "TEXT"),
        ("rezervaraimportata", "pret_platit", "REAL"),
        ("rezervaraimportata", "email", "TEXT"),
        ("rezervaraimportata", "telefon", "TEXT"),
        ("rezervaraimportata", "sursa", "TEXT DEFAULT 'booking'"),
        ("fisaoaspete", "semnatura_img", "TEXT"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in migrations:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass


def _cleanup_orphan_declaratie_ids():
    """Curăță declaratie_id orfan (declarație ștearsă dar referința a rămas)."""
    from sqlalchemy import text

    with engine.connect() as conn:
        try:
            conn.execute(text("""
                UPDATE rezervaraimportata
                SET declaratie_id = NULL
                WHERE declaratie_id IS NOT NULL
                  AND declaratie_id NOT IN (SELECT id FROM declaratie)
            """))
            conn.commit()
        except Exception:
            pass


def _seed_proprietati():
    from sqlmodel import Session, select
    from models import Proprietate

    proprietati = [
        Proprietate(
            slug="heart-bucharest",
            nume="Heart of Bucharest Studio",
            adresa="Str. Crișului nr. 5, sc. 1, demisol, ap. 4",
            sector="Sector 4",
            oras="București",
            autoritate="DITL Sector 4",
            template_pdf=str(BASE_DIR / "data" / "proprietati" / "heart-bucharest" / "template.pdf"),
            taxa_per_noapte=10.0,
        ),
        Proprietate(
            slug="infinite-sea-mamaia",
            nume="Infinite Sea View Studio",
            adresa="Mamaia",
            sector=None,
            oras="Constanța",
            autoritate="Primăria Constanța / DITL Constanța",
            template_pdf=str(BASE_DIR / "data" / "proprietati" / "infinite-sea-mamaia" / "template.pdf"),
            taxa_per_noapte=10.0,
        ),
    ]

    with Session(engine) as session:
        for prop in proprietati:
            existing = session.exec(select(Proprietate).where(Proprietate.slug == prop.slug)).first()
            if not existing:
                session.add(prop)
        session.commit()
