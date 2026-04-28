import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { useProprietate } from "../hooks/useProprietate";

const LUNI = ["", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
               "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

function fmt(iso) {
  if (!iso) return "—";
  return iso.split("-").reverse().join(".");
}

const EMPTY_FORM = { numar_rezervare: "", nume_turist: "", check_in: "", check_out: "", persoane: 1, pret_platit: "" };

function comisionRate(sursa) {
  // Airbnb: 3% + 21% TVA inclus = 3% × 1.21; Booking: 15% (fara TVA separat)
  return sursa === "airbnb" ? 0.03 * 1.21 : 0.15;
}

function LunaCard({ grup, proprietateId, taxaPerNoapte = 10, onDeclarat, onSters }) {
  const [open, setOpen] = useState(!grup.declaratie_id);
  const [confirmare, setConformare] = useState(false);
  const [confirmStergere, setConfirmStergere] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStergere, setLoadingStergere] = useState(false);
  const [error, setError] = useState(null);
  const [rezultat, setRezultat] = useState(null);
  const [formManual, setFormManual] = useState(null); // null = ascuns, {} = deschis
  const [loadingManual, setLoadingManual] = useState(false);
  const [errorManual, setErrorManual] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const isDeclarat = !!grup.declaratie_id;
  const totalNopti = grup.rezervari.reduce((s, r) => s + r.nopti_in_luna, 0);
  const totalPers  = grup.rezervari.reduce((s, r) => s + r.nopti_in_luna * r.persoane, 0);
  const taxaEst    = grup.taxa_totala ?? totalPers * 10;

  async function handleStergere() {
    setLoadingStergere(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/rezervari?proprietate_id=${proprietateId}&luna=${grup.luna}&an=${grup.an}`,
        { method: "DELETE" }
      );
      const d = await res.json();
      if (!res.ok) { setError(d.detail ?? "Eroare la ștergere."); setConfirmStergere(false); return; }
      onSters();
    } catch {
      setError("Nu s-a putut contacta serverul.");
    } finally {
      setLoadingStergere(false);
      setConfirmStergere(false);
    }
  }

  async function handleGenereaza() {
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("proprietate_id", proprietateId);
    fd.append("luna", grup.luna);
    fd.append("an", grup.an);
    try {
      const res = await fetch("/api/declaratii/genereaza-din-import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Eroare la generare."); return; }
      setRezultat(data);
      onDeclarat();
    } catch {
      setError("Nu s-a putut contacta serverul.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdaugaManual(e) {
    e.preventDefault();
    setLoadingManual(true);
    setErrorManual(null);
    const fd = new FormData();
    fd.append("proprietate_id", proprietateId);
    fd.append("check_in", formManual.check_in);
    fd.append("check_out", formManual.check_out);
    fd.append("persoane", formManual.persoane);
    if (formManual.pret_platit) fd.append("pret_platit", formManual.pret_platit);
    if (formManual.nume_turist) fd.append("nume_turist", formManual.nume_turist);
    if (formManual.numar_rezervare) fd.append("numar_rezervare", formManual.numar_rezervare);
    try {
      const res = await fetch("/api/rezervari/manual", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErrorManual(data.detail ?? "Eroare."); return; }
      setFormManual(null);
      onSters(); // reîncarcă lista
    } catch {
      setErrorManual("Nu s-a putut contacta serverul.");
    } finally {
      setLoadingManual(false);
    }
  }

  async function handleStergeRezervare(bookingId) {
    if (!window.confirm(`Ștergi rezervarea ${bookingId}?`)) return;
    setDeletingId(bookingId);
    try {
      const res = await fetch(`/api/rezervari/${encodeURIComponent(bookingId)}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); alert(d.detail ?? "Eroare la ștergere."); return; }
      onSters();
    } catch {
      alert("Nu s-a putut contacta serverul.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{
      border: `1.5px solid ${isDeclarat || rezultat ? "#86efac" : "#fde68a"}`,
      borderRadius: 10, marginBottom: 12, overflow: "hidden",
    }}>
      {/* Header */}
      <div
        onClick={() => { setOpen((o) => !o); setConformare(false); }}
        style={{
          background: isDeclarat || rezultat ? "#f0fdf4" : "#fffbeb",
          padding: "12px 16px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12, userSelect: "none",
        }}
      >
        <span style={{ fontSize: 16 }}>{isDeclarat || rezultat ? "✅" : "⚠️"}</span>
        <strong style={{ fontSize: 14, color: isDeclarat || rezultat ? "#15803d" : "#92400e", flex: 1 }}>
          {LUNI[grup.luna]} {grup.an}
        </strong>
        <span style={{ fontSize: 12, color: "#6b7fa8" }}>
          {grup.rezervari.length} rez · {totalNopti} nopți · {totalPers} nopți×pers
        </span>

        {rezultat ? (
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => { e.stopPropagation(); navigate(`/declaratii/${rezultat.id}`); }}
          >
            Detalii
          </button>
        ) : isDeclarat ? (
          <span onClick={(e) => { e.stopPropagation(); navigate(`/declaratii/${grup.declaratie_id}`); }}>
            <StatusBadge status={grup.status_declaratie} />
          </span>
        ) : (
          <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setOpen(true); setConformare(true); setConfirmStergere(false); setFormManual(null); }}
            >
              + Generează
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ background: "#fff7ed", borderColor: "#fb923c", color: "#9a3412" }}
              onClick={() => { setOpen(true); setFormManual(EMPTY_FORM); setConformare(false); setConfirmStergere(false); }}
            >
              + Airbnb
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => { setOpen(true); setConfirmStergere(true); setConformare(false); setFormManual(null); }}
            >
              🗑
            </button>
          </div>
        )}
        <span style={{ color: "#9ca3af", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>

      {/* Conținut expandat */}
      {open && (
        <div>
          {/* Tabel rezervări */}
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr>
                {[
                  "Nr. rezervare", "Sursa", "Nume turist", "Check-in", "Check-out",
                  "Pers.", "Zile", "Taxa T", "Plătit",
                  "Comision", "Încasat", "Venit", "TVA", "Net", "",
                ].map((h) => (
                  <th key={h} style={{
                    background: "#f9fafb", padding: "5px 6px", textAlign: "center",
                    fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb", fontSize: 10,
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grup.rezervari.map((r) => {
                const taxaTurism = r.nopti_in_luna * r.persoane * taxaPerNoapte;
                const platit     = r.pret_platit ?? 0;
                const isAirbnb   = r.sursa === "airbnb" || r.sursa === "manual";
                const comision   = platit * comisionRate(r.sursa);
                const incasat    = platit - comision - platit * 0.013;
                const venit      = incasat - taxaTurism;
                const tvaIntra   = isAirbnb ? null : comision * 0.21;
                const profitNet  = venit - (tvaIntra ?? 0);
                const isManual   = isAirbnb;
                const P = "5px 6px";
                return (
                  <tr key={r.booking_id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: P }}><code style={{ fontSize: 9 }}>{r.booking_id}</code></td>
                    <td style={{ padding: P }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8,
                        background: isManual ? "#fff7ed" : "#dbeafe",
                        color: isManual ? "#9a3412" : "#1e40af",
                      }}>
                        {isManual ? "AB" : "BK"}
                      </span>
                    </td>
                    <td style={{ padding: P, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.nume_turist ?? <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td style={{ padding: P, whiteSpace: "nowrap" }}>{fmt(r.check_in)}</td>
                    <td style={{ padding: P, whiteSpace: "nowrap" }}>{fmt(r.check_out)}</td>
                    <td style={{ padding: P, textAlign: "center" }}>{r.persoane}</td>
                    <td style={{ padding: P, textAlign: "center" }}><strong>{r.nopti_in_luna}</strong></td>
                    <td style={{ padding: P, textAlign: "right" }}>{taxaTurism.toFixed(0)}</td>
                    <td style={{ padding: P, textAlign: "right" }}>
                      {r.pret_platit != null ? r.pret_platit.toFixed(2) : <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td style={{ padding: P, textAlign: "right" }}>
                      {r.pret_platit != null ? comision.toFixed(2) : <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td style={{ padding: P, textAlign: "right", color: "#1d4ed8" }}>
                      {r.pret_platit != null ? incasat.toFixed(2) : <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td style={{ padding: P, textAlign: "right", fontWeight: 600, color: "#15803d" }}>
                      {r.pret_platit != null ? venit.toFixed(2) : <span style={{ color: "#9ca3af" }}>—</span>}
                    </td>
                    <td style={{ padding: P, textAlign: "right" }}>
                      {r.pret_platit != null && tvaIntra != null
                        ? tvaIntra.toFixed(2)
                        : <span style={{ color: "#9ca3af", fontSize: 9 }}>—</span>}
                    </td>
                    <td style={{ padding: P, textAlign: "right", fontWeight: 700,
                      color: r.pret_platit != null ? (profitNet >= 0 ? "#15803d" : "#dc2626") : "#9ca3af" }}>
                      {r.pret_platit != null ? profitNet.toFixed(2) : "—"}
                    </td>
                    <td style={{ padding: "4px 2px", textAlign: "center" }}>
                      {!grup.declaratie_id && !rezultat && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: "1px 5px", fontSize: 10 }}
                          disabled={deletingId === r.booking_id}
                          onClick={() => handleStergeRezervare(r.booking_id)}
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: isDeclarat || rezultat ? "#f0fdf4" : "#fffbeb", borderTop: "2px solid #e5e7eb" }}>
                <td colSpan={7} style={{ padding: "6px 6px", fontWeight: 700, fontSize: 10, color: "#374151" }}>
                  Total
                </td>
                <td style={{ padding: "6px 6px", textAlign: "right", fontWeight: 700, fontSize: 11, color: isDeclarat || rezultat ? "#15803d" : "#92400e" }}>
                  {grup.rezervari.reduce((s, r) => s + r.nopti_in_luna * r.persoane * (grup.taxa_per_noapte ?? 10), 0).toFixed(0)}
                </td>
                {(() => {
                  const hasPrice = grup.rezervari.some((r) => r.pret_platit != null);
                  if (!hasPrice) return <td colSpan={5} />;
                  const totPlatit   = grup.rezervari.reduce((s, r) => s + (r.pret_platit ?? 0), 0);
                  const totComision = grup.rezervari.reduce((s, r) => s + (r.pret_platit ?? 0) * comisionRate(r.sursa), 0);
                  const totIncasat  = grup.rezervari.reduce((s, r) => s + (r.pret_platit ?? 0) - (r.pret_platit ?? 0) * comisionRate(r.sursa) - (r.pret_platit ?? 0) * 0.013, 0);
                  const totTaxaT    = grup.rezervari.reduce((s, r) => s + r.nopti_in_luna * r.persoane * (grup.taxa_per_noapte ?? 10), 0);
                  const totTva      = grup.rezervari.reduce((s, r) => {
                    if (r.sursa === "airbnb" || r.sursa === "manual") return s;
                    const com = (r.pret_platit ?? 0) * comisionRate(r.sursa);
                    return s + com * 0.21;
                  }, 0);
                  const totVenit    = totIncasat - totTaxaT;
                  const totProfit   = totVenit - totTva;
                  const FP = "6px 6px";
                  return (<>
                    <td style={{ padding: FP, textAlign: "right", fontWeight: 700 }}>{totPlatit.toFixed(2)}</td>
                    <td style={{ padding: FP, textAlign: "right", fontWeight: 700 }}>{totComision.toFixed(2)}</td>
                    <td style={{ padding: FP, textAlign: "right", fontWeight: 700, color: "#1d4ed8" }}>{totIncasat.toFixed(2)}</td>
                    <td style={{ padding: FP, textAlign: "right", fontWeight: 700, color: "#15803d" }}>{totVenit.toFixed(2)}</td>
                    <td style={{ padding: FP, textAlign: "right", fontWeight: 700 }}>{totTva.toFixed(2)}</td>
                    <td style={{ padding: FP, textAlign: "right", fontWeight: 800,
                      color: totProfit >= 0 ? "#15803d" : "#dc2626" }}>{totProfit.toFixed(2)}</td>
                    <td />
                  </>);
                })()}
              </tr>
            </tfoot>
          </table>
          </div>

          {/* Panel confirmare ștergere */}
          {!isDeclarat && !rezultat && confirmStergere && (
            <div style={{
              margin: "0 16px 16px", padding: "16px",
              background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 8,
            }}>
              <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>
                Ștergi rezervările pentru {LUNI[grup.luna]} {grup.an}?
              </div>
              <p style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 12 }}>
                Se vor șterge <strong>{grup.rezervari.length}</strong> rezervări din lista importată.
                Operația este reversibilă — poți re-importa XLS-ul oricând.
              </p>
              {error && <div className="alert alert-error" style={{ marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-danger" onClick={handleStergere} disabled={loadingStergere}>
                  {loadingStergere ? <><span className="spinner" /> Se șterge...</> : "🗑 Confirmă ștergerea"}
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmStergere(false)} disabled={loadingStergere}>
                  Anulează
                </button>
              </div>
            </div>
          )}

          {/* Panel confirmare generare */}
          {!isDeclarat && !rezultat && confirmare && (
            <div style={{
              margin: "0 16px 16px", padding: "16px",
              background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8,
            }}>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 10 }}>
                Generează declarație {LUNI[grup.luna]} {grup.an}
              </div>
              <div className="summary-grid" style={{ marginBottom: 12 }}>
                <div className="summary-box">
                  <div className="label">Rezervări</div>
                  <div className="value">{grup.rezervari.length}</div>
                </div>
                <div className="summary-box">
                  <div className="label">Total nopți</div>
                  <div className="value">{totalNopti}</div>
                </div>
                <div className="summary-box">
                  <div className="label">Nopți × Pers</div>
                  <div className="value">{totalPers}</div>
                </div>
                <div className="summary-box">
                  <div className="label">Taxă estimată</div>
                  <div className="value">{taxaEst} <span className="unit">RON</span></div>
                </div>
              </div>
              {error && <div className="alert alert-error" style={{ marginBottom: 10 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-success" onClick={handleGenereaza} disabled={loading}>
                  {loading ? <><span className="spinner" /> Se generează...</> : "📄 Confirmă și generează"}
                </button>
                <button className="btn btn-ghost" onClick={() => setConformare(false)} disabled={loading}>
                  Anulează
                </button>
              </div>
            </div>
          )}

          {/* Formular rezervare manuală Airbnb */}
          {!isDeclarat && !rezultat && formManual && (
            <div style={{
              margin: "0 16px 16px", padding: "16px",
              background: "#fff7ed", border: "1.5px solid #fb923c", borderRadius: 8,
            }}>
              <div style={{ fontWeight: 700, color: "#9a3412", marginBottom: 12 }}>
                + Rezervare manuală Airbnb — {LUNI[grup.luna]} {grup.an}
              </div>
              <form onSubmit={handleAdaugaManual}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
                  <div className="form-group">
                    <label>Nr. rezervare Airbnb</label>
                    <input type="text" placeholder="ex: HMXXXXXXXX" value={formManual.numar_rezervare}
                      onChange={(e) => setFormManual((f) => ({ ...f, numar_rezervare: e.target.value }))}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1.5px solid #d1d9ee", fontSize: 13 }} />
                  </div>
                  <div className="form-group">
                    <label>Nume turist</label>
                    <input type="text" value={formManual.nume_turist}
                      onChange={(e) => setFormManual((f) => ({ ...f, nume_turist: e.target.value }))}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1.5px solid #d1d9ee", fontSize: 13 }} />
                  </div>
                  <div className="form-group">
                    <label>Check-in *</label>
                    <input type="date" required value={formManual.check_in}
                      onChange={(e) => setFormManual((f) => ({ ...f, check_in: e.target.value }))}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1.5px solid #d1d9ee", fontSize: 13 }} />
                  </div>
                  <div className="form-group">
                    <label>Check-out *</label>
                    <input type="date" required value={formManual.check_out}
                      onChange={(e) => setFormManual((f) => ({ ...f, check_out: e.target.value }))}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1.5px solid #d1d9ee", fontSize: 13 }} />
                  </div>
                  <div className="form-group">
                    <label>Persoane *</label>
                    <input type="number" required min={1} max={20} value={formManual.persoane}
                      onChange={(e) => setFormManual((f) => ({ ...f, persoane: Number(e.target.value) }))}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1.5px solid #d1d9ee", fontSize: 13, width: "100%" }} />
                  </div>
                  <div className="form-group">
                    <label>Plătit turist (RON)</label>
                    <input type="number" step="0.01" min={0} value={formManual.pret_platit}
                      onChange={(e) => setFormManual((f) => ({ ...f, pret_platit: e.target.value }))}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1.5px solid #d1d9ee", fontSize: 13, width: "100%" }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#92400e", marginBottom: 10 }}>
                  Comision Airbnb: 3% + TVA 21% din plătit turist
                </div>
                {errorManual && <div className="alert alert-error" style={{ marginBottom: 10 }}>{errorManual}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={loadingManual}>
                    {loadingManual ? <><span className="spinner" /> Se salvează...</> : "💾 Salvează"}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFormManual(null); setErrorManual(null); }} disabled={loadingManual}>
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Succes inline */}
          {rezultat && (
            <div style={{ margin: "0 16px 16px", padding: "14px 16px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8 }}>
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: 8 }}>
                ✅ Declarație generată — {rezultat.taxa_totala} RON
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/declaratii/${rezultat.id}`)}>
                  Detalii declarație
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => window.open(`/api/declaratii/${rezultat.id}/folder`, "_blank")}>
                  📁 Deschide folder
                </button>
                <a href={`/api/declaratii/${rezultat.id}/download`} className="btn btn-ghost btn-sm">
                  ⬇ PDF
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Rezervari() {
  const [proprietati, setProprietati] = useState([]);
  const [proprietateId, setProprietateId] = useProprietate(proprietati);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [error, setError] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [fisier, setFisier] = useState(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    fetch("/api/proprietati")
      .then((r) => r.json())
      .then((d) => {
        setProprietati(d);
      });
  }, []);

  useEffect(() => {
    if (proprietateId) loadRezervari();
  }, [proprietateId]);

  async function loadRezervari() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rezervari?proprietate_id=${proprietateId}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Nu s-a putut încărca lista rezervărilor.");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(f) {
    if (!f) return;
    if (!f.name.match(/\.xls(x)?$/i)) { setError("Selectează un fișier .xls."); return; }
    setFisier(f);
    setError(null);
  }

  async function handleImport() {
    if (!fisier || !proprietateId) return;
    setLoadingImport(true);
    setError(null);
    const fd = new FormData();
    fd.append("xls_file", fisier);
    fd.append("proprietate_id", proprietateId);
    try {
      const res = await fetch("/api/rezervari/scan", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { setError(d.detail ?? "Eroare import."); return; }
      setData(d);
      setImportStats(d.import_stats ?? null);
      setFisier(null);
    } catch {
      setError("Nu s-a putut contacta serverul.");
    } finally {
      setLoadingImport(false);
    }
  }

  const sortDesc = (arr) => [...arr].sort((a, b) => b.an !== a.an ? b.an - a.an : b.luna - a.luna);
  const nedeclarate = sortDesc(data?.luni.filter((g) => !g.declaratie_id) ?? []);
  const declarate   = sortDesc(data?.luni.filter((g) =>  g.declaratie_id) ?? []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📋 Toate rezervările</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {proprietati.length > 1 && (
            <select
              value={proprietateId}
              onChange={(e) => setProprietateId(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: 7, border: "1.5px solid #d1d9ee", fontSize: 13 }}
            >
              {proprietati.map((p) => <option key={p.id} value={p.id}>{p.nume}</option>)}
            </select>
          )}
          <button className="btn btn-ghost btn-sm" onClick={loadRezervari}>🔄 Refresh</button>
        </div>
      </div>

      {/* Import XLS */}
      <div className="card" style={{ borderTop: "3px solid #60a5fa" }}>
        <div className="card-title">📥 Importă / actualizează din XLS</div>
        <p style={{ fontSize: 13, color: "#6b7fa8", marginBottom: 12 }}>
          Uploadează un export Booking.com pentru a adăuga sau actualiza rezervările.
          Re-importul e safe — datele existente nu se șterg, doar se actualizează.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div
            className={`file-drop${over ? " over" : ""}`}
            style={{ padding: "10px 20px", flex: 1, minWidth: 200 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={inputRef} type="file" accept=".xls,.xlsx" onClick={(e) => e.stopPropagation()} onChange={(e) => handleFile(e.target.files[0])} />
            {fisier
              ? <span className="file-name">✅ {fisier.name}</span>
              : <span>📂 <strong>Trage XLS</strong> sau click</span>}
          </div>
          <button className="btn btn-primary" onClick={handleImport} disabled={!fisier || loadingImport}>
            {loadingImport ? <><span className="spinner" /> Se importă...</> : "📥 Importă"}
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}
        {importStats && (
          <div className="alert alert-success" style={{ marginTop: 10 }}>
            ✅ Import finalizat —{" "}
            <strong>{importStats.noi}</strong> rezervări noi adăugate
            {importStats.existente > 0 && <>, <strong>{importStats.existente}</strong> deja existente (actualizate)</>}
            {importStats.ignorate > 0 && <>, <strong>{importStats.ignorate}</strong> anulate ignorate</>}
          </div>
        )}
      </div>

      {/* Sumar */}
      {data && (
        <div className="summary-grid">
          <div className="summary-box">
            <div className="label">Luni importate</div>
            <div className="value">{data.luni.length}</div>
          </div>
          <div className="summary-box">
            <div className="label">Nedeclarate</div>
            <div className="value" style={{ color: nedeclarate.length > 0 ? "#d97706" : "#15803d" }}>
              {nedeclarate.length}
            </div>
          </div>
          <div className="summary-box">
            <div className="label">Declarate</div>
            <div className="value">{declarate.length}</div>
          </div>
          <div className="summary-box">
            <div className="label">Total rezervări</div>
            <div className="value">{data.luni.reduce((s, g) => s + g.rezervari.length, 0)}</div>
          </div>
        </div>
      )}

      {/* Lista luni */}
      {loading ? (
        <div className="empty"><div className="empty-icon">⏳</div><p>Se încarcă...</p></div>
      ) : !data || data.luni.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>Nu există rezervări importate. Uploadează un export XLS pentru a începe.</p>
          </div>
        </div>
      ) : (
        <>
          {nedeclarate.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ color: "#d97706" }}>
                ⚠️ Luni nedeclarate ({nedeclarate.length})
              </div>
              {nedeclarate.map((g) => (
                <LunaCard key={`${g.luna}-${g.an}`} grup={g}
                  proprietateId={proprietateId} taxaPerNoapte={data?.taxa_per_noapte ?? 10} onDeclarat={loadRezervari} onSters={loadRezervari} />
              ))}
            </div>
          )}
          {declarate.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ color: "#15803d" }}>
                ✅ Luni declarate ({declarate.length})
              </div>
              {declarate.map((g) => (
                <LunaCard key={`${g.luna}-${g.an}`} grup={g}
                  proprietateId={proprietateId} taxaPerNoapte={data?.taxa_per_noapte ?? 10} onDeclarat={loadRezervari} onSters={loadRezervari} />
              ))}
            </div>
          )}

        </>
      )}
    </div>
  );
}
