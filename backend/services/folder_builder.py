"""
Construiește folderul lunar output/<proprietate-slug>/<YYYY-MM>/ cu toate documentele necesare.
"""

import shutil
from pathlib import Path


LUNI_RO = {
    1: "Ianuarie", 2: "Februarie", 3: "Martie", 4: "Aprilie",
    5: "Mai", 6: "Iunie", 7: "Iulie", 8: "August",
    9: "Septembrie", 10: "Octombrie", 11: "Noiembrie", 12: "Decembrie",
}

PLACEHOLDER_SALUBRITATE = """\
PLACEHOLDER — Dovada plății salubritate
========================================
Adaugă manual în acest folder dovada plății salubritate
înainte de depunerea declarației pe start.ps4.ro.
"""


def construieste_folder(
    proprietate_slug: str,
    luna: int,
    an: int,
    pdf_declaratie_path: str,
    documente_statice_dir: str,
    output_base_dir: str,
) -> str:
    """
    Creează structura:
      output/<slug>/<YYYY-MM>/
        declaratie_taxa_MM_YYYY.pdf
        <fișiere statice copiate>
        dovada_salubritate_PLACEHOLDER.txt

    Returnează calea absolută a folderului creat.
    """
    folder = Path(output_base_dir) / proprietate_slug / f"{an:04d}-{luna:02d}"
    folder.mkdir(parents=True, exist_ok=True)

    # Copiază PDF-ul declarației generat
    dest_pdf = folder / f"declaratie_taxa_{luna:02d}_{an}.pdf"
    shutil.copy2(pdf_declaratie_path, dest_pdf)

    # Copiază documentele statice (CI, contract etc.)
    statice_dir = Path(documente_statice_dir)
    if statice_dir.exists():
        for fis in statice_dir.iterdir():
            if fis.is_file():
                shutil.copy2(fis, folder / fis.name)

    # Placeholder dovadă salubritate
    placeholder = folder / "dovada_salubritate_PLACEHOLDER.txt"
    placeholder.write_text(PLACEHOLDER_SALUBRITATE, encoding="utf-8")

    return str(folder)
