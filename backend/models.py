import uuid
from typing import Optional, List
from enum import Enum
from datetime import datetime, date
from sqlmodel import SQLModel, Field, Relationship


class StatusDeclaratie(str, Enum):
    generat = "generat"
    depus = "depus"


class Proprietate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True)
    nume: str
    adresa: str
    sector: Optional[str] = None
    oras: str
    autoritate: str
    template_pdf: str
    taxa_per_noapte: float = 10.0
    activa: bool = True

    declaratii: List["Declaratie"] = Relationship(back_populates="proprietate")


class Declaratie(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    proprietate_id: int = Field(foreign_key="proprietate.id")
    luna: int
    an: int
    data_generare: datetime = Field(default_factory=datetime.now)
    total_nopti: int = 0
    total_persoane_zile: int = 0
    taxa_totala: float = 0.0
    status: StatusDeclaratie = StatusDeclaratie.generat
    folder_output: Optional[str] = None
    pdf_path: Optional[str] = None

    proprietate: Optional[Proprietate] = Relationship(back_populates="declaratii")
    rezervari: List["Rezervare"] = Relationship(back_populates="declaratie")


class Rezervare(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    declaratie_id: int = Field(foreign_key="declaratie.id")
    proprietate_id: int = Field(foreign_key="proprietate.id")
    booking_id: str = Field(unique=True, index=True)
    check_in: date
    check_out: date
    persoane: int
    nopti_in_luna: int
    taxa_aferenta: float

    declaratie: Optional[Declaratie] = Relationship(back_populates="rezervari")


class StatusFisa(str, Enum):
    netrimis = "netrimis"
    trimis = "trimis"
    completat = "completat"


class FisaOaspete(SQLModel, table=True):
    """Fișă de înregistrare turist — generată per rezervare, completată de oaspete."""
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(default_factory=lambda: uuid.uuid4().hex, unique=True, index=True)
    booking_id: str = Field(index=True)
    proprietate_id: int = Field(foreign_key="proprietate.id")

    # Pre-completat din XLS
    check_in: date
    check_out: date
    nume_turist: Optional[str] = None
    email: Optional[str] = None
    telefon: Optional[str] = None

    # Status
    status: StatusFisa = StatusFisa.netrimis
    creat_la: datetime = Field(default_factory=datetime.now)
    trimis_la: Optional[datetime] = None
    completat_la: Optional[datetime] = None

    # Completat de turist
    prenume: Optional[str] = None
    sex: Optional[str] = None          # M / F
    data_nasterii: Optional[date] = None
    cetatenie: Optional[str] = None
    tip_document: Optional[str] = None  # CI / pasaport
    serie_numar: Optional[str] = None
    tara_emitenta: Optional[str] = None
    domiciliu: Optional[str] = None
    confirmare_date: bool = False
    semnatura_nume: Optional[str] = None
    semnatura_img: Optional[str] = None  # base64 PNG


class RezervaraImportata(SQLModel, table=True):
    """Stochează toate rezervările văzute în orice XLS uploadat — persistent, independent de declarații."""
    id: Optional[int] = Field(default=None, primary_key=True)
    booking_id: str = Field(unique=True, index=True)
    proprietate_id: int = Field(foreign_key="proprietate.id")
    check_in: date
    check_out: date
    persoane: int
    nume_turist: Optional[str] = Field(default=None)
    pret_platit: Optional[float] = Field(default=None)
    email: Optional[str] = Field(default=None)
    telefon: Optional[str] = Field(default=None)
    sursa: str = Field(default="booking")  # "booking" | "airbnb" | "manual"
    importat_la: datetime = Field(default_factory=datetime.now)
    # NULL dacă nu e declarată; se setează când se generează declarația pentru luna corespunzătoare
    declaratie_id: Optional[int] = Field(default=None, foreign_key="declaratie.id")
