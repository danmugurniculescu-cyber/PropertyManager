# Taxa Turism Manager — Plan de implementare

## Scopul aplicației

Aplicație web locală (rulează pe laptop) pentru gestionarea lunară a declarațiilor de taxă turistică, cu generare automată PDF din export Booking.com și organizare documente pentru depunere la autoritățile locale.

Aplicația este **multi-locație** — gestionează mai multe proprietăți simultan, fiecare cu propriul template PDF, autoritate locală, documente statice și istoric de declarații separat.

### Proprietăți configurate inițial

| Proprietate | Locație | Autoritate | Formular |
|---|---|---|---|
| Heart of Bucharest Studio | Str. Crișului nr. 5, sc. 1, demisol, ap. 4, Sector 4 | DITL Sector 4 — start.ps4.ro | Declarație-decont HCGMB 516/2025 |
| Infinite Sea View Studio | Mamaia, Constanța | Primăria Constanța / DITL Constanța | TBD — formular specific Constanța |

> Formularul și autoritatea pentru Mamaia pot diferi față de București — se configurează separat per proprietate când devine disponibil.

---

## Stack recomandat

| Layer | Tehnologie | Motiv |
|---|---|---|
| Backend | Python / FastAPI | Consistent cu scripturile existente (Playwright, pdfrw) |
| Frontend | React + Vite | UI modern, suficient pentru uz local |
| Bază de date | SQLite (via SQLModel) | Zero configurare, fișier local, portabil |
| PDF filling | pdfrw | Menține câmpurile editabile după salvare |
| Excel parsing | xlrd | Compatibil cu exportul .xls de pe Booking.com |
| Stocare fișiere | Folder local structurat | Simplu, accesibil direct din Explorer |

---

## Structura folderelor

```
taxa-turism/
├── backend/
│   ├── main.py               # FastAPI app, toate rutele
│   ├── models.py             # SQLModel — Declaratie, Rezervare
│   ├── database.py           # Conexiune SQLite
│   ├── services/
│   │   ├── booking_parser.py # Citire XLS Booking.com → rezervări
│   │   ├── pdf_generator.py  # Completare PDF declarație cu pdfrw
│   │   └── folder_builder.py # Construire folder lunar cu toate documentele
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Tabel istoric declarații
│   │   │   ├── UploadBooking.jsx # Upload XLS + preview rezervări
│   │   │   └── Declaratie.jsx    # Detaliu declarație + generare
│   │   └── components/
│   │       ├── RezervaриTable.jsx
│   │       └── StatusBadge.jsx
│   └── package.json
├── data/
│   ├── db.sqlite
│   ├── proprietati/
│   │   ├── heart-bucharest/
│   │   │   ├── template.pdf              # Declarație pre-completată Sector 4
│   │   │   └── documente_statice/
│   │   │       ├── CI.pdf
│   │   │       └── contract_salubritate.pdf
│   │   └── infinite-sea-mamaia/
│   │       ├── template.pdf              # Template Constanța (TBD)
│   │       └── documente_statice/
│   │           └── CI.pdf
├── output/                   # Generat automat, structurat per proprietate
│   ├── heart-bucharest/
│   │   └── 2026-05/
│   │       ├── declaratie_taxa_05_2026.pdf
│   │       ├── CI.pdf
│   │       ├── contract_salubritate.pdf
│   │       └── dovada_salubritate.pdf    # Adăugat manual
│   └── infinite-sea-mamaia/
│       └── 2026-05/
│           ├── declaratie_taxa_05_2026.pdf
│           └── CI.pdf
└── CLAUDE.md
```

---

## Baza de date — modele

### Tabel `proprietati`

| Câmp | Tip | Descriere |
|---|---|---|
| id | int PK | |
| nume | str | ex: „Heart of Bucharest Studio" |
| adresa | str | |
| sector | str | |
| oras | str | ex: „București", „Constanța" |
| autoritate | str | ex: „DITL Sector 4" |
| template_pdf | str | calea spre PDF-ul pre-completat specific |
| taxa_per_noapte | float | RON — poate diferi per localitate |
| activa | bool | pentru dezactivare fără ștergere |

### Tabel `declaratii`

| Câmp | Tip | Descriere |
|---|---|---|
| id | int PK | |
| proprietate_id | int FK | proprietatea pentru care se declară |
| luna | int | 1–12 |
| an | int | ex: 2026 |
| data_generare | datetime | când a fost generată |
| total_nopti | int | nopți în luna respectivă |
| total_persoane_zile | int | nopți × persoane |
| taxa_totala | float | RON |
| status | enum | `draft` / `generat` / `depus` |
| folder_output | str | calea folderului generat |
| pdf_path | str | calea PDF-ului declarației |

### Tabel `rezervari`

| Câmp | Tip | Descriere |
|---|---|---|
| id | int PK | |
| declaratie_id | int FK | |
| proprietate_id | int FK | redundant pentru queries rapide |
| booking_id | str UNIQUE | numărul rezervării din Booking — cheie de deduplicare |
| check_in | date | |
| check_out | date | |
| persoane | int | |
| nopti_in_luna | int | nopți care cad în luna declarată |
| taxa_aferenta | float | RON |

> **`booking_id` este UNIQUE global** (nu per declarație) — aceeași rezervare nu poate apărea în două declarații diferite.

---

## API — rute FastAPI

```
GET    /api/declaratii                  # Lista toate declarațiile (istoric)
GET    /api/declaratii/{id}             # Detaliu declarație + rezervări
POST   /api/declaratii/preview          # Upload XLS → preview rezervări fără salvare
                                        # Răspuns include: rezervari_noi[], rezervari_duplicate[]
POST   /api/declaratii/genereaza        # Upload XLS + luna/an → salvează + generează PDF + folder
                                        # Salvează DOAR rezervari_noi; ignoră duplicate
PATCH  /api/declaratii/{id}/status      # Marchează ca depus
GET    /api/declaratii/{id}/download    # Descarcă PDF-ul declarației
GET    /api/declaratii/{id}/folder      # Deschide folderul output în Explorer
DELETE /api/declaratii/{id}             # Șterge declarație din DB (nu și fișierele)
```

---

## Fluxul principal (UX)

### 1. Upload export Booking

- User descarcă XLS din Booking Extranet (filtrat pe luna dorită)
- Upload în aplicație → backend parsează rezervările și face **verificare duplicate**:

#### Logica de deduplicare

```python
# Pentru fiecare rezervare din XLS:
# 1. Caută booking_id în tabelul rezervari (toate declarațiile istorice)
# 2. Clasifică rezervarea ca nouă sau duplicat

rezultat = {
    "rezervari_noi": [...],       # booking_id inexistent în DB
    "rezervari_duplicate": [...], # booking_id deja salvat
}
```

- Frontend afișează **două tabele separate**:

**Rezervări noi** (vor fi incluse în declarație):
| Nr. rezervare | Check-in | Check-out | Persoane | Nopți în lună | Taxă |
|---|---|---|---|---|---|
| 6739514181 | 01.05 | 04.05 | 2 | 3 | 30 RON |

**Rezervări duplicate** (deja declarate anterior — excluse automat):
| Nr. rezervare | Check-in | Check-out | Declarată în | Status |
|---|---|---|---|---|
| 6651168638 | 16.04 | 18.04 | Aprilie 2026 | ✅ Depus |

- User vede clar ce e nou și ce e duplicat înainte de generare
- Calculele (totaluri, taxă) se fac **doar pe rezervările noi**
- Dacă **toate** rezervările din XLS sunt duplicate → mesaj de avertizare, nu se generează declarație

### 2. Generare declarație

- User selectează luna și anul
- Click „Generează declarație"
- Backend:
  1. Calculează totaluri
  2. Salvează în DB
  3. Completează PDF-ul din template cu pdfrw
  4. Construiește folderul `output/YYYY-MM/`:
     - `declaratie_taxa_MM_YYYY.pdf` (completat cu luna/an/suma/nopti)
     - `CI.pdf` (copiat din `documente_statice/`)
     - `contract_salubritate.pdf` (copiat din `documente_statice/`)
     - `dovada_salubritate_PLACEHOLDER.txt` (reminder că trebuie adăugat manual)
- Frontend afișează confirmare + buton „Deschide folder"

### 3. Finalizare și depunere

- User adaugă manual dovada plății salubritate în folder
- Marchează declarația ca „Depus" în aplicație
- Încarcă documentele pe start.ps4.ro

---

## Dashboard — ce afișează

Tabel cu toate declarațiile istorice:

| Lună | An | Nopți | Nopți×Pers | Taxă (RON) | Status | Acțiuni |
|---|---|---|---|---|---|---|
| Mai | 2026 | 14 | 28 | 280 | ✅ Depus | Detalii / Folder |
| Iunie | 2026 | 0 | 0 | 0 | ⏳ Draft | Generează |

Filtre: an, status (draft/generat/depus)

---

## Câmpurile completate automat în PDF

Câmpurile variabile completate la fiecare generare:

| Field ID în PDF | Valoare calculată |
|---|---|
| `fill_12` | Luna (ex: „Mai") |
| `undefined` | Anul (ex: „2026") |
| `fill_14` | Suma totală (ex: „280 RON") |
| `fill_24` | Nopți × persoane (ex: „28") |
| `TaxaClasificat...` | Taxa (ex: „280 RON") |
| `fill_17` | Data generării (ex: „18.04.2026") |

Câmpurile fixe (nume, CNP, adresă etc.) sunt pre-completate în template și nu se modifică.

---

## Documente statice — configurare

Fișierele care se copiază lunar în folder se configurează în `config.json`:

```json
{
  "documente_statice": [
    { "nume": "CI.pdf", "sursa": "data/documente_statice/CI.pdf" },
    { "nume": "contract_salubritate.pdf", "sursa": "data/documente_statice/contract_salubritate.pdf" }
  ],
  "template_pdf": "data/templates/declaratie_template_NDM.pdf",
  "output_dir": "output"
}
```

---

## Pornire aplicație

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Sau un singur script `start.bat` (Windows) care pornește ambele.

---

## Ordine de implementare recomandată

### Faza 1 — Backend core
1. Setup FastAPI + SQLite + SQLModel
2. `booking_parser.py` — portează logica din scriptul existent
3. `pdf_generator.py` — portează logica pdfrw din scriptul existent
4. `folder_builder.py` — copiere fișiere statice + placeholder
5. Rute API: preview, genereaza, lista, detaliu

### Faza 2 — Frontend
6. Dashboard cu tabel istoric (fetch din API)
7. Pagina upload XLS + tabel preview rezervări
8. Buton generare + confirmare + link folder
9. Marcare status „Depus"

### Faza 3 — Polish
10. Script `start.bat` pentru pornire one-click
11. Validări:
    - Lună duplicată (declarație deja existentă pentru luna/an selectat)
    - Fișier XLS invalid sau gol
    - Toate rezervările din XLS sunt deja declarate → bloc generare cu mesaj clar
    - Rezervări parțial duplicate → generare cu avertisment și lista exclusă vizibilă
12. Export CSV istoric pentru evidență contabilă

---

## Note importante

- Aplicația rulează **strict local** — nu are nevoie de server, cloud sau autentificare
- PDF-ul template (`declaratie_template_NDM.pdf`) trebuie înlocuit când DITL actualizează formularul
- Logica de calcul: nopțile se calculează per-zi (gestionează corect rezervările care traversează luni)
- Rezervările anulate (statut != „ok") sunt ignorate automat
- Pentru Booking.com: exportul XLS trebuie filtrat pe luna dorită înainte de upload
