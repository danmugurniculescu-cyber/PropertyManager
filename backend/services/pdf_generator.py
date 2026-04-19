"""
Completare PDF declarație taxă turistică din template pre-completat.
Completează DOAR câmpurile variabile; câmpurile fixe sunt deja în template.
"""

from datetime import datetime
from pathlib import Path

import pdfrw


LUNI_RO = {
    1: "Ianuarie", 2: "Februarie", 3: "Martie", 4: "Aprilie",
    5: "Mai", 6: "Iunie", 7: "Iulie", 8: "August",
    9: "Septembrie", 10: "Octombrie", 11: "Noiembrie", 12: "Decembrie",
}

# Câmpuri variabile conform template declaratie_template_NDM.pdf
CAMPURI_VARIABILE = [
    "fill_12",
    "undefined",
    "fill_14",
    "fill_24",
    "TaxaClasificat Neclasificat \u00cen curs de clasificare",
    "fill_17",
]


def genereaza_pdf(
    template_path: str,
    output_path: str,
    luna: int,
    an: int,
    total_nopti: int,
    total_persoane_zile: int,
    taxa_totala: float,
    data_generare: datetime | None = None,
) -> int:
    """
    Completează template-ul și salvează la output_path.
    Returnează numărul de câmpuri completate cu succes.
    """
    if data_generare is None:
        data_generare = datetime.now()

    valori = {
        "fill_12":   LUNI_RO[luna],
        "undefined": str(an),
        "fill_14":   f"{taxa_totala:.0f} RON",
        "fill_24":   str(total_persoane_zile),
        "TaxaClasificat Neclasificat \u00cen curs de clasificare": f"{taxa_totala:.0f} RON",
        "fill_17":   data_generare.strftime("%d.%m.%Y"),
    }

    tmpl = pdfrw.PdfReader(template_path)
    if tmpl.Root.AcroForm:
        tmpl.Root.AcroForm.update(pdfrw.PdfDict(NeedAppearances=pdfrw.PdfObject("true")))

    completate = 0
    for page in tmpl.pages:
        for annot in (page.Annots or []):
            if annot.Subtype != "/Widget":
                continue
            name = str(annot.T).strip("()") if annot.T else ""
            if name not in valori:
                continue
            annot.V = pdfrw.PdfString.encode(valori[name])
            if annot.AP:
                annot.AP = None
            completate += 1

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    pdfrw.PdfWriter().write(output_path, tmpl)
    return completate
