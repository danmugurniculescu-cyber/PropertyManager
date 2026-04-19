"""
Parsare export XLS Booking.com și clasificare rezervări noi vs. duplicate.

Coloane așteptate în XLS (Booking.com România):
  Numărul rezervării, Check-in, Check-out, Persoane, Statut
"""

import calendar
import re
from datetime import date, datetime
from typing import Optional

import xlrd
from sqlmodel import Session, select


STATUT_ANULAT = {"anulat", "cancelled", "anulată", "no_show"}


def _parse_pret(val) -> Optional[float]:
    if val is None or val == "":
        return None
    if isinstance(val, (int, float)):
        return float(val)
    m = re.search(r"[\d]+(?:[.,]\d+)?", str(val).replace(",", "."))
    return float(m.group().replace(",", ".")) if m else None


def _parse_date(val, datemode) -> date:
    if isinstance(val, str):
        return datetime.strptime(val.strip(), "%Y-%m-%d").date()
    if isinstance(val, float):
        return date(*xlrd.xldate_as_tuple(val, datemode)[:3])
    raise ValueError(f"Format dată necunoscut: {val!r}")


def _nopti_in_luna(ci: date, co: date, luna: int, an: int) -> int:
    prima_zi = date(an, luna, 1)
    ultima_zi = date(an, luna, calendar.monthrange(an, luna)[1])
    nopti = 0
    zi = ci
    while zi < co:
        if prima_zi <= zi <= ultima_zi:
            nopti += 1
        # advance one day
        try:
            zi = zi.replace(day=zi.day + 1)
        except ValueError:
            if zi.month == 12:
                zi = date(zi.year + 1, 1, 1)
            else:
                zi = date(zi.year, zi.month + 1, 1)
    return nopti


def parseaza_xls(
    xls_bytes: bytes,
    luna: int,
    an: int,
    taxa_per_noapte: float,
    session: Session,
    proprietate_id: int,
) -> dict:
    """
    Returnează:
      {
        rezervari_noi: [...],
        rezervari_duplicate: [...],
        total_nopti: int,
        total_persoane_zile: int,
        taxa_totala: float,
      }
    Câmpuri per rezervare_noua:
      booking_id, check_in, check_out, persoane, nopti_in_luna, taxa_aferenta
    Câmpuri per rezervare_duplicat:
      booking_id, check_in, check_out, declaratie_id, status_declaratie
    """
    from models import Rezervare, Declaratie, RezervaraImportata

    wb = xlrd.open_workbook(file_contents=xls_bytes)
    sh = wb.sheets()[0]
    if sh.nrows < 2:
        raise ValueError("Fișierul XLS este gol.")

    header = [str(sh.cell_value(0, c)).strip().lower() for c in range(sh.ncols)]
    col = {h: i for i, h in enumerate(header)}

    def get_col(*names) -> Optional[int]:
        for n in names:
            if n in col:
                return col[n]
        return None

    idx_id   = get_col("numărul rezervării", "numar rezervare", "reservation id", "booking number")
    idx_ci   = get_col("check-in")
    idx_co   = get_col("check-out")
    idx_pers = get_col("persoane", "guests", "adulți", "adulti")
    idx_stat = get_col("statut", "status")
    idx_nume = get_col("numele clientului", "prenume și nume", "prenume si nume", "guestname", "guest name", "nume", "name")
    idx_pret = get_col("prețul camerei", "pretul camerei", "preț", "pret", "total", "price", "room price")
    idx_tel  = get_col("număr de telefon", "numar de telefon", "phone", "telephone", "telefon")
    idx_email = get_col("email", "e-mail", "adresă email", "adresa email")

    if any(x is None for x in (idx_id, idx_ci, idx_co, idx_pers)):
        raise ValueError(f"Coloane lipsă în XLS. Header detectat: {header}")

    rezervari_noi = []
    rezervari_duplicate = []
    # {(luna, an): [{"booking_id", "check_in", "check_out", "persoane"}]}
    alte_luni: dict[tuple[int, int], list] = {}
    total_nopti = 0
    total_pz = 0

    for r in range(1, sh.nrows):
        try:
            if idx_stat is not None:
                statut = str(sh.cell_value(r, idx_stat)).lower().strip()
                if statut in STATUT_ANULAT:
                    continue

            raw_id = sh.cell_value(r, idx_id)
            booking_id = str(int(float(raw_id))) if isinstance(raw_id, (int, float)) else str(raw_id).strip()

            ci = _parse_date(sh.cell_value(r, idx_ci), wb.datemode)
            co = _parse_date(sh.cell_value(r, idx_co), wb.datemode)
            persoane = int(sh.cell_value(r, idx_pers))
            nume_turist = str(sh.cell_value(r, idx_nume)).strip() if idx_nume is not None else None
            raw_pret = sh.cell_value(r, idx_pret) if idx_pret is not None else None
            pret_platit = _parse_pret(raw_pret)
            telefon = str(sh.cell_value(r, idx_tel)).strip() if idx_tel is not None else None
            email = str(sh.cell_value(r, idx_email)).strip() if idx_email is not None else None

            nopti_luna_selectata = _nopti_in_luna(ci, co, luna, an)

            # Detectează în ce luni cade această rezervare
            luni_rezervare = _luni_acoperite(ci, co)

            # Rezervările din alte luni nedeclarate încă
            for (l, a) in luni_rezervare:
                if (l, a) == (luna, an):
                    continue
                nopti_acolo = _nopti_in_luna(ci, co, l, a)
                if nopti_acolo == 0:
                    continue
                # Verifică dacă booking_id e deja declarat
                rez_ex = session.exec(
                    select(Rezervare).where(Rezervare.booking_id == booking_id)
                ).first()
                if rez_ex:
                    continue  # deja declarat — nu e reminder
                key = (l, a)
                if key not in alte_luni:
                    alte_luni[key] = []
                # Evită duplicate în lista de reminder (același booking_id apare o singură dată per lună)
                if not any(x["booking_id"] == booking_id for x in alte_luni[key]):
                    alte_luni[key].append({
                        "booking_id": booking_id,
                        "check_in": ci.isoformat(),
                        "check_out": co.isoformat(),
                        "persoane": persoane,
                        "nopti_in_luna": nopti_acolo,
                    })

            if nopti_luna_selectata == 0:
                continue

            # Deduplicare pentru luna selectată
            rez_existenta = session.exec(
                select(Rezervare).where(Rezervare.booking_id == booking_id)
            ).first()

            if rez_existenta:
                decl = session.get(Declaratie, rez_existenta.declaratie_id)
                rezervari_duplicate.append({
                    "booking_id": booking_id,
                    "check_in": ci.isoformat(),
                    "check_out": co.isoformat(),
                    "declaratie_id": rez_existenta.declaratie_id,
                    "declaratie_luna": decl.luna if decl else None,
                    "declaratie_an": decl.an if decl else None,
                    "status_declaratie": decl.status if decl else None,
                })
            else:
                taxa = nopti_luna_selectata * persoane * taxa_per_noapte
                rezervari_noi.append({
                    "booking_id": booking_id,
                    "check_in": ci.isoformat(),
                    "check_out": co.isoformat(),
                    "persoane": persoane,
                    "nopti_in_luna": nopti_luna_selectata,
                    "taxa_aferenta": taxa,
                })
                total_nopti += nopti_luna_selectata
                total_pz += nopti_luna_selectata * persoane

            # Upsert în rezervari_importate — indiferent de luna selectată
            _upsert_importata(session, booking_id, proprietate_id, ci, co, persoane, nume_turist, pret_platit, telefon, email)

        except Exception:
            continue

    taxa_totala = total_pz * taxa_per_noapte

    # Serializează alte_luni ca listă sortată cronologic
    alte_luni_list = [
        {"luna": l, "an": a, "rezervari": rezervari}
        for (l, a), rezervari in sorted(alte_luni.items())
    ]

    return {
        "rezervari_noi": rezervari_noi,
        "rezervari_duplicate": rezervari_duplicate,
        "alte_luni_nedeclarate": alte_luni_list,
        "total_nopti": total_nopti,
        "total_persoane_zile": total_pz,
        "taxa_totala": taxa_totala,
    }


def _upsert_importata(session: Session, booking_id: str, proprietate_id: int,
                      ci: date, co: date, persoane: int,
                      nume_turist: Optional[str] = None,
                      pret_platit: Optional[float] = None,
                      telefon: Optional[str] = None,
                      email: Optional[str] = None) -> None:
    """Inserează sau actualizează rezervarea în tabelul persistent rezervaraimportata."""
    from models import RezervaraImportata
    existenta = session.exec(
        select(RezervaraImportata).where(RezervaraImportata.booking_id == booking_id)
    ).first()
    if existenta:
        existenta.check_in = ci
        existenta.check_out = co
        existenta.persoane = persoane
        if nume_turist is not None:
            existenta.nume_turist = nume_turist
        if pret_platit is not None:
            existenta.pret_platit = pret_platit
        if telefon is not None:
            existenta.telefon = telefon
        if email is not None:
            existenta.email = email
        session.add(existenta)
    else:
        session.add(RezervaraImportata(
            booking_id=booking_id,
            proprietate_id=proprietate_id,
            check_in=ci,
            check_out=co,
            persoane=persoane,
            nume_turist=nume_turist,
            pret_platit=pret_platit,
            telefon=telefon,
            email=email,
        ))


def importa_xls_complet(xls_bytes: bytes, proprietate_id: int, session: Session) -> dict:
    """
    Importă TOATE rezervările valide din XLS în tabelul persistent.
    Returnează {"noi": int, "existente": int, "ignorate": int}.
    """
    from models import RezervaraImportata

    wb = xlrd.open_workbook(file_contents=xls_bytes)
    sh = wb.sheets()[0]
    if sh.nrows < 2:
        raise ValueError("Fișierul XLS este gol.")

    header = [str(sh.cell_value(0, c)).strip().lower() for c in range(sh.ncols)]
    col = {h: i for i, h in enumerate(header)}

    def gc(*names):
        for n in names:
            if n in col: return col[n]
        return None

    idx_id   = gc("numărul rezervării", "numar rezervare", "reservation id", "booking number")
    idx_ci   = gc("check-in")
    idx_co   = gc("check-out")
    idx_pers = gc("persoane", "guests", "adulți", "adulti")
    idx_stat = gc("statut", "status")
    idx_nume = gc("numele clientului", "prenume și nume", "prenume si nume", "guestname", "guest name", "nume", "name")
    idx_pret = gc("prețul camerei", "pretul camerei", "preț", "pret", "total", "price", "room price")
    idx_tel  = gc("număr de telefon", "numar de telefon", "phone", "telephone", "telefon")
    idx_email = gc("email", "e-mail", "adresă email", "adresa email")

    if any(x is None for x in (idx_id, idx_ci, idx_co, idx_pers)):
        raise ValueError(f"Coloane lipsă în XLS. Header detectat: {header}")

    noi = existente = ignorate = 0
    for r in range(1, sh.nrows):
        try:
            if idx_stat is not None:
                if str(sh.cell_value(r, idx_stat)).lower().strip() in STATUT_ANULAT:
                    ignorate += 1
                    continue
            raw_id = sh.cell_value(r, idx_id)
            booking_id = str(int(float(raw_id))) if isinstance(raw_id, (int, float)) else str(raw_id).strip()
            ci = _parse_date(sh.cell_value(r, idx_ci), wb.datemode)
            co = _parse_date(sh.cell_value(r, idx_co), wb.datemode)
            persoane = int(sh.cell_value(r, idx_pers))
            nume_turist = str(sh.cell_value(r, idx_nume)).strip() if idx_nume is not None else None
            raw_pret = sh.cell_value(r, idx_pret) if idx_pret is not None else None
            pret_platit = _parse_pret(raw_pret)
            telefon = str(sh.cell_value(r, idx_tel)).strip() if idx_tel is not None else None
            email = str(sh.cell_value(r, idx_email)).strip() if idx_email is not None else None

            deja = session.exec(
                select(RezervaraImportata).where(RezervaraImportata.booking_id == booking_id)
            ).first()
            _upsert_importata(session, booking_id, proprietate_id, ci, co, persoane, nume_turist, pret_platit, telefon, email)
            if deja:
                existente += 1
            else:
                noi += 1
        except Exception:
            continue

    session.commit()
    return {"noi": noi, "existente": existente, "ignorate": ignorate}


def _luni_acoperite(ci: date, co: date) -> list[tuple[int, int]]:
    """Returnează lista de (luna, an) acoperite de intervalul [ci, co)."""
    luni = []
    y, m = ci.year, ci.month
    while (y, m) <= (co.year, co.month):
        luni.append((m, y))
        if m == 12:
            y += 1; m = 1
        else:
            m += 1
    return luni
