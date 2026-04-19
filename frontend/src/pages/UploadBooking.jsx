import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RezervariNoi, RezervariDuplicate } from "../components/RezervariTable";

const LUNI = ["", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
               "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

const azi = new Date();

export default function UploadBooking() {
  const [proprietati, setProprietati] = useState([]);
  const [proprietateId, setProprietateId] = useState("");
  const [luna, setLuna] = useState(azi.getMonth() + 1);
  const [an, setAn] = useState(azi.getFullYear());
  const [fisier, setFisier] = useState(null);
  const [over, setOver] = useState(false);

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [error, setError] = useState(null);
  const [rezultat, setRezultat] = useState(null);

  const inputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/proprietati")
      .then((r) => r.json())
      .then((data) => {
        setProprietati(data);
        if (data.length > 0) setProprietateId(data[0].id);
      });
  }, []);

  function handleFile(f) {
    if (!f) return;
    if (!f.name.match(/\.xls(x)?$/i)) {
      setError("Selectează un fișier .xls exportat din Booking.com.");
      return;
    }
    setFisier(f);
    setPreview(null);
    setRezultat(null);
    setError(null);
  }

  async function handlePreview() {
    if (!fisier || !proprietateId) return;
    setLoadingPreview(true);
    setError(null);
    setPreview(null);

    const fd = new FormData();
    fd.append("xls_file", fisier);
    fd.append("luna", luna);
    fd.append("an", an);
    fd.append("proprietate_id", proprietateId);

    try {
      const res = await fetch("/api/declaratii/preview", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Eroare la preview."); return; }
      setPreview(data);
    } catch {
      setError("Nu s-a putut contacta serverul.");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleGenereaza() {
    if (!fisier || !proprietateId) return;
    setLoadingGen(true);
    setError(null);

    const fd = new FormData();
    fd.append("xls_file", fisier);
    fd.append("luna", luna);
    fd.append("an", an);
    fd.append("proprietate_id", proprietateId);

    try {
      const res = await fetch("/api/declaratii/genereaza", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Eroare la generare."); return; }
      setRezultat(data);
    } catch {
      setError("Nu s-a putut contacta serverul.");
    } finally {
      setLoadingGen(false);
    }
  }

  const canPreview = fisier && proprietateId && !loadingPreview && !rezultat;
  const canGenerate = preview && preview.rezervari_noi?.length > 0 && !loadingGen && !rezultat;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📤 Declarație nouă</h1>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>← Dashboard</button>
      </div>

      {/* Step 1 — Upload */}
      <div className="card">
        <div className="card-title">1. Configurare</div>

        <div className="form-row">
          <div className="form-group">
            <label>Proprietate</label>
            <select value={proprietateId} onChange={(e) => { setProprietateId(e.target.value); setPreview(null); setRezultat(null); }}>
              {proprietati.map((p) => (
                <option key={p.id} value={p.id}>{p.nume}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Luna</label>
            <select value={luna} onChange={(e) => { setLuna(Number(e.target.value)); setPreview(null); setRezultat(null); }}>
              {LUNI.slice(1).map((l, i) => (
                <option key={i + 1} value={i + 1}>{l}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Anul</label>
            <input
              type="number" value={an} min={2020} max={2099}
              onChange={(e) => { setAn(Number(e.target.value)); setPreview(null); setRezultat(null); }}
              style={{ width: 90 }}
            />
          </div>
        </div>

        {/* File drop */}
        <div
          className={`file-drop${over ? " over" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <input ref={inputRef} type="file" accept=".xls,.xlsx" onClick={(e) => e.stopPropagation()} onChange={(e) => handleFile(e.target.files[0])} />
          <div className="file-icon">📂</div>
          {fisier ? (
            <div className="file-name">✅ {fisier.name}</div>
          ) : (
            <>
              <div style={{ fontWeight: 600 }}>Trage fișierul XLS sau click pentru selectare</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: .7 }}>Export din Booking.com Extranet (.xls)</div>
            </>
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button className="btn btn-outline" onClick={handlePreview} disabled={!canPreview}>
            {loadingPreview ? <><span className="spinner" style={{ borderTopColor: "#1a3a6b" }} /> Se analizează...</> : "🔍 Analizează rezervările"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">❌ {error}</div>}

      {/* Step 2 — Preview */}
      {preview && !rezultat && (
        <>
          {/* Sumar totale */}
          <div className="summary-grid">
            <div className="summary-box">
              <div className="label">Rezervări noi</div>
              <div className="value">{preview.rezervari_noi.length}</div>
            </div>
            <div className="summary-box">
              <div className="label">Total nopți</div>
              <div className="value">{preview.total_nopti}</div>
            </div>
            <div className="summary-box">
              <div className="label">Nopți × Persoane</div>
              <div className="value">{preview.total_persoane_zile}</div>
            </div>
            <div className="summary-box">
              <div className="label">Taxă de plată</div>
              <div className="value">{preview.taxa_totala} <span className="unit">RON</span></div>
            </div>
          </div>

          {/* Rezervări noi */}
          <div className="card">
            <div className="section-header">
              <div className="section-label">
                ✅ Rezervări noi
                <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                  {preview.rezervari_noi.length}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#6b7fa8" }}>vor fi incluse în declarație</span>
            </div>
            {preview.rezervari_noi.length === 0
              ? <div className="alert alert-warning">⚠️ Toate rezervările din fișier sunt deja declarate. Nu se poate genera o declarație nouă.</div>
              : <RezervariNoi rezervari={preview.rezervari_noi} />}
          </div>

          {/* Rezervări duplicate */}
          {preview.rezervari_duplicate.length > 0 && (
            <div className="card">
              <div className="section-header">
                <div className="section-label">
                  ⚠️ Rezervări duplicate — excluse automat
                  <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                    {preview.rezervari_duplicate.length}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#6b7fa8" }}>deja declarate anterior</span>
              </div>
              <RezervariDuplicate rezervari={preview.rezervari_duplicate} />
            </div>
          )}

          {/* Alte luni nedeclarate — reminder */}
          {preview.alte_luni_nedeclarate?.length > 0 && (
            <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
              <div className="section-header">
                <div className="section-label">
                  🔔 Rezervări nedeclarate din alte luni
                  <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                    {preview.alte_luni_nedeclarate.reduce((s, g) => s + g.rezervari.length, 0)}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#6b7fa8" }}>din același export XLS</span>
              </div>
              <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                Fișierul conține rezervări din alte luni care nu au fost încă declarate. Generează câte o declarație pentru fiecare lună.
              </div>
              {preview.alte_luni_nedeclarate.map((grup) => (
                <div key={`${grup.luna}-${grup.an}`} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 6, fontSize: 13 }}>
                    📅 {LUNI[grup.luna]} {grup.an} — {grup.rezervari.length} rezervări
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Nr. rezervare</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Persoane</th>
                          <th>Nopți în lună</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grup.rezervari.map((r) => (
                          <tr key={r.booking_id}>
                            <td><code style={{ fontSize: 12 }}>{r.booking_id}</code></td>
                            <td>{r.check_in?.split("-").reverse().join(".")}</td>
                            <td>{r.check_out?.split("-").reverse().join(".")}</td>
                            <td>{r.persoane}</td>
                            <td><strong>{r.nopti_in_luna}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Buton generare */}
          {preview.rezervari_noi.length > 0 && (
            <div className="confirm-box">
              <h3>Generează declarația pentru {LUNI[luna]} {an}</h3>
              <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 14 }}>
                Se vor salva <strong>{preview.rezervari_noi.length}</strong> rezervări noi,
                se va completa PDF-ul și se va crea folderul cu documentele necesare.
              </p>
              <button className="btn btn-success" onClick={handleGenereaza} disabled={!canGenerate}>
                {loadingGen
                  ? <><span className="spinner" /> Se generează...</>
                  : `📄 Generează declarație — ${preview.taxa_totala} RON`}
              </button>
            </div>
          )}
        </>
      )}

      {/* Step 3 — Success */}
      {rezultat && (
        <div className="success-panel">
          <h3>✅ Declarație generată cu succes!</h3>
          <div className="summary-grid" style={{ marginBottom: 16 }}>
            <div className="summary-box">
              <div className="label">Nopți</div>
              <div className="value">{rezultat.total_nopti}</div>
            </div>
            <div className="summary-box">
              <div className="label">Nopți×Pers</div>
              <div className="value">{rezultat.total_persoane_zile}</div>
            </div>
            <div className="summary-box">
              <div className="label">Taxă</div>
              <div className="value">{rezultat.taxa_totala} <span className="unit">RON</span></div>
            </div>
            <div className="summary-box">
              <div className="label">Câmpuri PDF</div>
              <div className="value">{rezultat.campuri_pdf_completate}/6</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#166534", marginBottom: 14 }}>
            📁 Folder: <code style={{ fontSize: 12, background: "#bbf7d0", padding: "2px 6px", borderRadius: 4 }}>{rezultat.folder_output}</code>
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-success" onClick={() => fetch(`/api/declaratii/${rezultat.id}/folder`)}>
              📁 Deschide folder
            </button>
            <button className="btn btn-outline" onClick={() => navigate(`/declaratii/${rezultat.id}`)}>
              Detalii declarație
            </button>
            <button className="btn btn-ghost" onClick={() => navigate("/")}>
              ← Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
