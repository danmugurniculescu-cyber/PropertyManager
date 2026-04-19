#!/usr/bin/env python3
"""
Generare automată Declarație-Decont Taxa Specială Promovare Turistică București
Din export Booking.com (.xls)

Utilizare:
    python genera_declaratie_taxa_turism.py --xls rezervari.xls --luna 5 --an 2026

Dependențe:
    pip install xlrd pdfrw --break-system-packages

Notă: Folosește declaratie_template_NDM.pdf ca template — câmpurile fixe
      (nume, CNP, adresă etc.) sunt deja pre-completate. Scriptul completează
      DOAR câmpurile variabile (luna, an, suma, nopți, taxă, data).
"""

import sys
import os
import argparse
import logging
from datetime import datetime, date
import calendar

try:
    import xlrd
except ImportError:
    print("Instalare: pip install xlrd --break-system-packages"); sys.exit(1)

try:
    import pdfrw
except ImportError:
    print("Instalare: pip install pdfrw --break-system-packages"); sys.exit(1)

TAXA_PER_NOAPTE_PERSOANA = 10  # RON

LUNI_RO = {
    1: "Ianuarie", 2: "Februarie", 3: "Martie", 4: "Aprilie",
    5: "Mai", 6: "Iunie", 7: "Iulie", 8: "August",
    9: "Septembrie", 10: "Octombrie", 11: "Noiembrie", 12: "Decembrie"
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger(__name__)


def _advance_date(d):
    m_days = calendar.monthrange(d.year, d.month)[1]
    if d.day < m_days:
        return date(d.year, d.month, d.day + 1)
    elif d.month < 12:
        return date(d.year, d.month + 1, 1)
    else:
        return date(d.year + 1, 1, 1)


def _parse_date(val, datemode):
    if isinstance(val, str):
        return datetime.strptime(val.strip(), "%Y-%m-%d").date()
    elif isinstance(val, float):
        return date(*xlrd.xldate_as_tuple(val, datemode)[:3])
    raise ValueError(f"Format necunoscut: {val!r}")


def citeste_rezervari(xls_path, luna, an):
    wb = xlrd.open_workbook(xls_path)
    sh = wb.sheets()[0]
    if sh.nrows < 2:
        log.error("XLS gol."); sys.exit(1)

    header = [sh.cell_value(0, c).strip().lower() for c in range(sh.ncols)]
    col = {h: i for i, h in enumerate(header)}

    idx_ci   = col.get("check-in")
    idx_co   = col.get("check-out")
    idx_pers = col.get("persoane")
    idx_stat = col.get("statut")

    if None in (idx_ci, idx_co, idx_pers):
        log.error(f"Coloane lipsă. Header: {header}"); sys.exit(1)

    prima_zi = date(an, luna, 1)
    ultima_zi = date(an, luna, calendar.monthrange(an, luna)[1])

    total_nopti = total_pz = 0
    rezervari = []

    for r in range(1, sh.nrows):
        try:
            if idx_stat is not None:
                statut = str(sh.cell_value(r, idx_stat)).lower().strip()
                if statut in ("anulat", "cancelled", "anulată", "no_show"):
                    continue
            ci = _parse_date(sh.cell_value(r, idx_ci), wb.datemode)
            co = _parse_date(sh.cell_value(r, idx_co), wb.datemode)
            persoane = int(sh.cell_value(r, idx_pers))

            nopti = 0
            zi = ci
            while zi < co:
                if prima_zi <= zi <= ultima_zi:
                    nopti += 1
                zi = _advance_date(zi)

            if nopti > 0:
                total_nopti += nopti
                total_pz += nopti * persoane
                rezervari.append({"check_in": ci, "check_out": co, "persoane": persoane, "nopti": nopti})
                log.info(f"  {ci} → {co}: {persoane} pers, {nopti} nopți în {luna}/{an}")

        except Exception as e:
            log.warning(f"Rând {r+1} ignorat: {e}")

    taxa = total_pz * TAXA_PER_NOAPTE_PERSOANA
    log.info(f"\n{'─'*50}")
    log.info(f"Rezervări valide: {len(rezervari)}")
    log.info(f"Total nopți: {total_nopti} | Nopți×pers: {total_pz} | Taxă: {taxa} RON")
    log.info(f"{'─'*50}\n")

    return {"luna": luna, "an": an, "total_nopti": total_nopti, "total_pz": total_pz, "taxa": taxa}


def completeaza_pdf(d, template_path, output_path):
    """Completează DOAR câmpurile variabile — template-ul conține deja datele fixe."""
    luna, an = d["luna"], d["an"]

    # Câmpuri variabile completate lunar
    VALORI = {
        "fill_12":   LUNI_RO[luna],
        "undefined": str(an),
        "fill_14":   f"{d['taxa']:.0f} RON",
        "fill_24":   str(d["total_pz"]),
        "TaxaClasificat Neclasificat \u00cen curs de clasificare": f"{d['taxa']:.0f} RON",
        "fill_17":   datetime.now().strftime("%d.%m.%Y"),
    }

    tmpl = pdfrw.PdfReader(template_path)
    if tmpl.Root.AcroForm:
        tmpl.Root.AcroForm.update(pdfrw.PdfDict(NeedAppearances=pdfrw.PdfObject('true')))

    ok = 0
    for page in tmpl.pages:
        for annot in (page.Annots or []):
            if annot.Subtype != '/Widget':
                continue
            name = str(annot.T).strip('()') if annot.T else ''
            if name not in VALORI:
                continue
            annot.V = pdfrw.PdfString.encode(VALORI[name])
            if annot.AP:
                annot.AP = None
            ok += 1

    pdfrw.PdfWriter().write(output_path, tmpl)
    log.info(f"Câmpuri completate: {ok}/{len(VALORI)} → {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generare declarație taxă turistică București")
    parser.add_argument("--xls",      required=True)
    parser.add_argument("--luna",     type=int, required=True)
    parser.add_argument("--an",       type=int, required=True)
    parser.add_argument("--template", default="declaratie_template_NDM.pdf")
    parser.add_argument("--output",   default=None)
    args = parser.parse_args()

    if not 1 <= args.luna <= 12:
        log.error("Luna trebuie 1-12"); sys.exit(1)
    for f in (args.xls, args.template):
        if not os.path.exists(f):
            log.error(f"Fișier negăsit: {f}"); sys.exit(1)

    output = args.output or f"declaratie_taxa_{args.luna:02d}_{args.an}.pdf"
    d = citeste_rezervari(args.xls, args.luna, args.an)
    completeaza_pdf(d, args.template, output)

    print(f"\n{'='*55}")
    print(f"  DECLARAȚIE GENERATĂ")
    print(f"{'='*55}")
    print(f"  Fișier:        {output}")
    print(f"  Perioadă:      {LUNI_RO[args.luna]} {args.an}")
    print(f"  Total nopți:   {d['total_nopti']}")
    print(f"  Nopți × pers: {d['total_pz']}")
    print(f"  Taxă:          {d['taxa']:.0f} RON")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
