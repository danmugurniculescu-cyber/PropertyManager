import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "";
const LUNI_RO = [
  "", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

function ron(val) {
  if (val == null) return "—";
  return val.toLocaleString("ro-RO", { minimumFractionDigits: 2 }) + " RON";
}

export default function Financiar() {
  const [an, setAn] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [importStats, setImportStats] = useState(null);
  const [fisier, setFisier] = useState(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef();

  useEffect(() => { incarcaDate(); }, [an]);

  async function incarcaDate() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/financiar?an=${an}`);
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e) {
      setError(`Eroare la încărcare: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleFile(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Selectează un fișier PDF.");
      return;
    }
    setFisier(f);
    setError(null);
    setImportStats(null);
  }

  async function handleUpload() {
    if (!fisier) return;
    setUploading(true);
    setError(null);
    setImportStats(null);
    const fd = new FormData();
    fd.append("pdf_file", fisier);
    try {
      const r = await fetch(`${API}/api/financiar/upload`, { method: "POST", body: fd });
      const json = await r.json();
      if (!r.ok) throw new Error(json.detail || r.statusText);
      setImportStats(json);
      setFisier(null);
      await incarcaDate();
    } catch (e) {
      setError(`Eroare upload: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function stergeTranzactie(id) {
    if (!confirm("Ștergi această tranzacție?")) return;
    try {
      const r = await fetch(`${API}/api/financiar/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());
      await incarcaDate();
    } catch (e) {
      setError(`Eroare ștergere: ${e.message}`);
    }
  }

  const ani = data?.ani_disponibili?.length
    ? data.ani_disponibili
    : [new Date().getFullYear()];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">💳 Financiar — Extrase de cont</h1>
      </div>

      {/* Upload PDF */}
      <div className="card" style={{ borderTop: "3px solid #60a5fa" }}>
        <div className="card-title">📄 Încarcă extras de cont ING (PDF)</div>
        <p style={{ fontSize: 13, color: "#6b7fa8", marginBottom: 12 }}>
          Uploadează un extras de cont PDF pentru a importa tranzacțiile.
          Re-importul e safe — duplicatele sunt ignorate automat.
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
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {fisier
              ? <span className="file-name">✅ {fisier.name}</span>
              : <span>📂 <strong>Trage PDF</strong> sau click</span>}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!fisier || uploading}
          >
            {uploading ? <><span className="spinner" /> Se importă...</> : "📥 Importă"}
          </button>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}
        {importStats && (
          <div className="alert alert-success" style={{ marginTop: 10 }}>
            ✅ Import finalizat —{" "}
            <strong>{importStats.noi}</strong> tranzacții noi adăugate
            {importStats.duplicate > 0 && <>, <strong>{importStats.duplicate}</strong> duplicate ignorate</>}
            {" "}din <strong>{importStats.total_gasite}</strong> găsite în PDF.
          </div>
        )}
      </div>

      {/* Filtru an */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 16px" }}>
        <span style={{ fontWeight: 600, color: "#1a3a6b" }}>An:</span>
        {ani.map(a => (
          <button
            key={a}
            onClick={() => setAn(a)}
            className={a === an ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
            style={{ borderRadius: 20, minWidth: 64 }}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Lista tranzacții */}
      {loading ? (
        <div className="empty"><div className="empty-icon">⏳</div><p>Se încarcă...</p></div>
      ) : !data || data.luni.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>Nu există tranzacții pentru {an}. Încarcă un extras de cont PDF.</p>
          </div>
        </div>
      ) : (
        <>
          {data.luni.map(grup => (
            <div key={`${grup.an}-${grup.luna}`} className="card" style={{ marginBottom: 16 }}>
              {/* Header lună */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 12, paddingBottom: 10, borderBottom: "2px solid #e8edf5",
              }}>
                <h3 style={{ margin: 0, color: "#1a3a6b", fontSize: 16 }}>
                  {LUNI_RO[grup.luna]} {grup.an}
                </h3>
                <span style={{
                  fontWeight: 700, fontSize: 15,
                  color: "#2d6a4f", background: "#e6f4ea",
                  padding: "4px 14px", borderRadius: 20,
                }}>
                  {ron(grup.subtotal)}
                </span>
              </div>

              {/* Tabel tranzacții */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 12 }}>
                <thead>
                  <tr style={{ background: "#f0f4ff" }}>
                    <th style={th}>Referință</th>
                    <th style={th}>Data</th>
                    <th style={{ ...th, textAlign: "right" }}>Sumă (RON)</th>
                    <th style={th}>Ordonator</th>
                    <th style={{ ...th, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {grup.tranzactii.map((t, idx) => (
                    <tr key={t.id} style={{ background: idx % 2 === 0 ? "#fff" : "#f9fbff" }}>
                      <td style={td}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#444" }}>
                          {t.referinta}
                        </span>
                      </td>
                      <td style={td}>{new Date(t.data + "T12:00:00").toLocaleDateString("ro-RO")}</td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 600, color: "#2d6a4f" }}>
                        {t.suma.toLocaleString("ro-RO", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ ...td, color: "#666", fontSize: 12 }}>{t.ordonator}</td>
                      <td style={{ ...td, textAlign: "center" }}>
                        <button
                          onClick={() => stergeTranzactie(t.id)}
                          title="Șterge tranzacție"
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#c00", fontSize: 14, padding: "2px 4px",
                          }}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Sumar fiscal lună */}
              <div style={{
                background: "#f8faff",
                border: "1px solid #d0d9ee",
                borderRadius: 8,
                padding: "12px 16px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}>
                <SumarBox label="Încasări" value={ron(grup.subtotal)} color="#1a3a6b" />
                <SumarBox label="Taxa turism (T)" value={ron(grup.taxa_t)} color="#92400e" minus />
                <SumarBox label="Valoare impozabilă" value={ron(grup.val_impozabila)} color="#1a3a6b" highlight />
                <SumarBox label="Impozit 7%" value={ron(grup.impozit)} color="#7c3aed" />
              </div>
            </div>
          ))}

          {/* Total general an */}
          <div style={{
            background: "#1a3a6b",
            borderRadius: 10,
            padding: "20px 24px",
            marginTop: 8,
            color: "#fff",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: 10 }}>
              📊 Total {an}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <TotalBox label="Total încasări" value={ron(data.total_incasari)} />
              <TotalBox label="Total Taxa T" value={ron(data.total_taxa_t)} sub />
              <TotalBox label="Val. impozabilă" value={ron(data.total_val_impozabila)} highlight />
              <TotalBox label="Impozit 7%" value={ron(data.total_impozit)} accent />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SumarBox({ label, value, color, highlight, minus }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "8px 4px",
      borderRadius: 6,
      background: highlight ? "#e8edf8" : "transparent",
    }}>
      <div style={{ fontSize: 11, color: "#6b7fa8", marginBottom: 4, fontWeight: 500 }}>
        {minus ? "− " : ""}{label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}

function TotalBox({ label, value, highlight, sub, accent }) {
  const bg = highlight ? "rgba(255,255,255,0.18)" : sub ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.1)";
  const textColor = accent ? "#c4b5fd" : highlight ? "#fff" : "rgba(255,255,255,0.85)";
  return (
    <div style={{
      background: bg,
      borderRadius: 8,
      padding: "12px 10px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: textColor }}>{value}</div>
    </div>
  );
}

const th = {
  padding: "8px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#1a3a6b",
  borderBottom: "1px solid #d0d9ee",
};

const td = {
  padding: "7px 12px",
  borderBottom: "1px solid #eef0f5",
};
