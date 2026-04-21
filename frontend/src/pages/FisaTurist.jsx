import { useEffect, useRef, useState } from "react";

const LUNI = ["", "Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
               "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_STYLE = {
  netrimis:  { bg: "#f3f4f6", color: "#374151", label: "⬜ Netrimis" },
  trimis:    { bg: "#fef3c7", color: "#92400e", label: "📨 Trimis" },
  completat: { bg: "#dcfce7", color: "#15803d", label: "✅ Completat" },
};

function fmt(iso) {
  if (!iso) return "—";
  return iso.split("-").reverse().join(".");
}

function InfoItem({ label, val }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7fa8", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: val ? "#1a3a6b" : "#9ca3af" }}>{val || "—"}</div>
    </div>
  );
}

function MesajModal({ fisa, onClose }) {
  const [limba, setLimba] = useState("ro");
  const [mesaj, setMesaj] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiat, setCopiat] = useState(false);

  async function load(l) {
    setLoading(true);
    const baseUrl = window.location.origin;
    const res = await fetch(`/api/fise/${fisa.id}/mesaj?limba=${l}&base_url=${encodeURIComponent(baseUrl)}`);
    const d = await res.json();
    setMesaj(d.mesaj);
    setLink(d.link);
    setLoading(false);
  }

  useEffect(() => { load(limba); }, [limba]);

  async function copiaza() {
    await navigator.clipboard.writeText(mesaj);
    setCopiat(true);
    setTimeout(() => setCopiat(false), 2000);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 24, width: 560, maxWidth: "95vw",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>📨 Mesaj pentru {fisa.nume_turist || fisa.booking_id}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {["ro", "en"].map((l) => (
            <button key={l} onClick={() => setLimba(l)}
              style={{
                padding: "5px 16px", borderRadius: 6, border: "1.5px solid",
                borderColor: limba === l ? "#1a3a6b" : "#d1d9ee",
                background: limba === l ? "#1a3a6b" : "#fff",
                color: limba === l ? "#fff" : "#374151",
                fontWeight: 600, cursor: "pointer", fontSize: 13,
              }}>
              {l === "ro" ? "🇷🇴 Română" : "🇬🇧 English"}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 10, fontSize: 12, color: "#6b7fa8" }}>
          Link fișă: <a href={link} target="_blank" rel="noreferrer" style={{ color: "#1a3a6b" }}>{link}</a>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}>Se generează...</div>
        ) : (
          <textarea
            readOnly value={mesaj}
            style={{
              width: "100%", height: 220, fontSize: 12, fontFamily: "inherit",
              border: "1.5px solid #d1d9ee", borderRadius: 8, padding: 12,
              resize: "vertical", boxSizing: "border-box", color: "#374151",
            }}
          />
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn btn-primary" onClick={copiaza} disabled={loading}>
            {copiat ? "✅ Copiat!" : "📋 Copiază mesajul"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Închide</button>
        </div>
      </div>
    </div>
  );
}

export default function FisaTurist() {
  const [proprietati, setProprietati] = useState([]);
  const [proprietateId, setProprietateId] = useState("");
  const [fise, setFise] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [importStats, setImportStats] = useState(null);
  const [error, setError] = useState(null);
  const [fisier, setFisier] = useState(null);
  const [over, setOver] = useState(false);
  const [filtruStatus, setFiltruStatus] = useState(null);
  const [modalFisa, setModalFisa] = useState(null);
  const [expandat, setExpandat] = useState(null);
  const [dataDe, setDataDe] = useState("");
  const [dataPana, setDataPana] = useState("");
  const inputRef = useRef();

  useEffect(() => {
    fetch("/api/proprietati").then((r) => r.json()).then((d) => {
      setProprietati(d);
      if (d.length > 0) setProprietateId(String(d[0].id));
    });
  }, []);

  useEffect(() => { if (proprietateId) loadFise(); }, [proprietateId]);

  async function loadFise() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fise?proprietate_id=${proprietateId}`);
      setFise(await res.json());
    } catch { setError("Nu s-a putut încărca lista."); }
    finally { setLoading(false); }
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
      const res = await fetch("/api/fise/import", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { setError(d.detail ?? "Eroare import."); return; }
      setImportStats(d);
      setFisier(null);
      loadFise();
    } catch { setError("Nu s-a putut contacta serverul."); }
    finally { setLoadingImport(false); }
  }

  async function marcheazaTrimis(fisa) {
    await fetch(`/api/fise/${fisa.id}/status?status=trimis`, { method: "PATCH" });
    loadFise();
  }

  async function reseteazaFisa(fisa) {
    if (!confirm(`Ștergi datele completate de turist pentru ${fisa.nume_turist || fisa.booking_id}?`)) return;
    await fetch(`/api/fise/${fisa.id}/reset`, { method: "PATCH" });
    loadFise();
  }

  async function stergeFisa(fisa) {
    if (!confirm(`Ștergi fișa pentru ${fisa.nume_turist || fisa.booking_id}?`)) return;
    await fetch(`/api/fise/${fisa.id}`, { method: "DELETE" });
    loadFise();
  }

  const filtrate = fise.filter((f) => {
    if (filtruStatus && f.status !== filtruStatus) return false;
    if (dataDe && f.check_in < dataDe) return false;
    if (dataPana && f.check_in > dataPana) return false;
    return true;
  });

  const stats = {
    netrimis:  fise.filter((f) => f.status === "netrimis").length,
    trimis:    fise.filter((f) => f.status === "trimis").length,
    completat: fise.filter((f) => f.status === "completat").length,
  };

  return (
    <div className="page">
      {modalFisa && <MesajModal fisa={modalFisa} onClose={() => setModalFisa(null)} />}

      <div className="page-header">
        <h1 className="page-title">📋 Fișe oaspeți</h1>
        {proprietati.length > 1 && (
          <select value={proprietateId} onChange={(e) => setProprietateId(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 7, border: "1.5px solid #d1d9ee", fontSize: 13 }}>
            {proprietati.map((p) => <option key={p.id} value={p.id}>{p.nume}</option>)}
          </select>
        )}
      </div>

      {/* Import */}
      <div className="card" style={{ borderTop: "3px solid #60a5fa" }}>
        <div className="card-title">📥 Importă rezervări din XLS</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div
            className={`file-drop${over ? " over" : ""}`}
            style={{ padding: "10px 20px", flex: 1, minWidth: 200 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <input ref={inputRef} type="file" accept=".xls,.xlsx"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleFile(e.target.files[0])} />
            {fisier ? <span className="file-name">✅ {fisier.name}</span>
              : <span>📂 <strong>Trage XLS</strong> sau click</span>}
          </div>
          <button className="btn btn-primary" onClick={handleImport} disabled={!fisier || loadingImport}>
            {loadingImport ? <><span className="spinner" /> Se importă...</> : "📥 Importă"}
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}
        {importStats && (
          <div className="alert alert-success" style={{ marginTop: 10 }}>
            ✅ <strong>{importStats.noi}</strong> fișe noi create,{" "}
            <strong>{importStats.actualizate}</strong> actualizate.
          </div>
        )}
      </div>

      {/* Sumar */}
      {fise.length > 0 && (
        <div className="summary-grid">
          {Object.entries(stats).map(([s, n]) => (
            <div key={s} className="summary-box" style={{ cursor: "pointer" }}
              onClick={() => setFiltruStatus(filtruStatus === s ? null : s)}>
              <div className="label">{STATUS_STYLE[s].label}</div>
              <div className="value" style={{ color: STATUS_STYLE[s].color }}>{n}</div>
            </div>
          ))}
          <div className="summary-box">
            <div className="label">Total</div>
            <div className="value">{fise.length}</div>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>Check-in de la</label>
          <input type="date" value={dataDe} onChange={(e) => setDataDe(e.target.value)}
            style={{ padding: "5px 8px", borderRadius: 6, border: "1.5px solid #d1d9ee", fontSize: 13, flex: "1 1 130px" }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>până la</label>
          <input type="date" value={dataPana} onChange={(e) => setDataPana(e.target.value)}
            style={{ padding: "5px 8px", borderRadius: 6, border: "1.5px solid #d1d9ee", fontSize: 13, flex: "1 1 130px" }} />
          <a
            href={`/api/fise/export?proprietate_id=${proprietateId}${dataDe ? `&data_de=${dataDe}` : ""}${dataPana ? `&data_pana=${dataPana}` : ""}`}
            className="btn btn-outline btn-sm"
            style={{ textDecoration: "none", whiteSpace: "nowrap" }}
          >
            📊 Export Excel
          </a>
        </div>
        <div className="filters">
          <button className={`filter-btn${!filtruStatus ? " active" : ""}`} onClick={() => setFiltruStatus(null)}>Toate</button>
          {Object.entries(STATUS_STYLE).map(([s, st]) => (
            <button key={s} className={`filter-btn${filtruStatus === s ? " active" : ""}`}
              onClick={() => setFiltruStatus(filtruStatus === s ? null : s)}>
              {st.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty"><div className="empty-icon">⏳</div><p>Se încarcă...</p></div>
        ) : filtrate.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>{fise.length === 0 ? "Importă un XLS pentru a genera fișele." : "Nicio fișă cu filtrul selectat."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {["", "Nr. rezervare", "Nume turist", "Check-in", "Check-out", "Email", "Telefon", "Status", "Acțiuni"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrate.map((f) => {
                  const st = STATUS_STYLE[f.status];
                  const isOpen = expandat === f.id;
                  const completat = f.status === "completat";
                  return (
                    <>
                      <tr key={f.id} style={{ background: isOpen ? "#f8faff" : undefined }}>
                        <td style={{ width: 24, textAlign: "center", color: "#9ca3af", fontSize: 11, cursor: completat ? "pointer" : "default" }}
                          onClick={() => completat && setExpandat(isOpen ? null : f.id)}>
                          {completat ? (isOpen ? "▲" : "▼") : ""}
                        </td>
                        <td><code style={{ fontSize: 11 }}>{f.booking_id}</code></td>
                        <td>{f.nume_turist || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{fmt(f.check_in)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{fmt(f.check_out)}</td>
                        <td style={{ fontSize: 12 }}>{f.email || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td style={{ fontSize: 12 }}>{f.telefon || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td>
                          <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                            {st.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", alignItems: "center" }}>
                            <button className="btn btn-primary btn-sm" onClick={() => setModalFisa(f)}>📨 Mesaj</button>
                            {f.status === "netrimis" && (
                              <button className="btn btn-outline btn-sm" onClick={() => marcheazaTrimis(f)}>✓ Trimis</button>
                            )}
                            {f.status === "completat" && (
                              <button className="btn btn-ghost btn-sm" onClick={() => reseteazaFisa(f)} title="Șterge datele completate de turist">🔄 Reset</button>
                            )}
                            <button className="btn btn-danger btn-sm" onClick={() => stergeFisa(f)} title="Șterge fișa">🗑</button>
                          </div>
                        </td>
                      </tr>
                      {completat && isOpen && (
                        <tr key={`${f.id}-detalii`} style={{ background: "#f0f4ff" }}>
                          <td colSpan={9} style={{ padding: "14px 20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px 24px" }}>
                              <InfoItem label="Prenume" val={f.prenume} />
                              <InfoItem label="Sex" val={f.sex === "M" ? "Bărbat" : f.sex === "F" ? "Femeie" : f.sex} />
                              <InfoItem label="Data nașterii" val={fmt(f.data_nasterii)} />
                              <InfoItem label="Cetățenie" val={f.cetatenie} />
                              <InfoItem label="Tip document" val={f.tip_document} />
                              <InfoItem label="Serie / Număr" val={f.serie_numar} />
                              <InfoItem label="Țara emitentă" val={f.tara_emitenta} />
                              <InfoItem label="Domiciliu" val={f.domiciliu} />
                              <InfoItem label="Completat la" val={f.completat_la ? fmt(f.completat_la.slice(0, 10)) : "—"} />
                              {f.semnatura_img && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7fa8", textTransform: "uppercase", marginBottom: 4 }}>Semnătură</div>
                                  <img src={f.semnatura_img} alt="semnatura"
                                    style={{ border: "1px solid #d1d9ee", borderRadius: 6, background: "#fafafa", maxWidth: 260, height: 65, objectFit: "contain" }} />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
