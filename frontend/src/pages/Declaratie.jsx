import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { RezervariNoi } from "../components/RezervariTable";

const LUNI = ["", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
               "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ro-RO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Declaratie() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [decl, setDecl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/declaratii/${id}`);
      if (!res.ok) throw new Error("Declarație negăsită");
      setDecl(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function marcheazaDepus() {
    setLoadingStatus(true);
    try {
      const res = await fetch(`/api/declaratii/${id}/status?status=depus`, { method: "PATCH" });
      if (res.ok) await load();
      else setError("Eroare la actualizarea statusului.");
    } finally {
      setLoadingStatus(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Ștergi această declarație din baza de date? Fișierele rămân pe disc.")) return;
    setLoadingDelete(true);
    try {
      await fetch(`/api/declaratii/${id}`, { method: "DELETE" });
      navigate("/");
    } finally {
      setLoadingDelete(false);
    }
  }

  if (loading) return <div className="page"><div className="empty"><div className="empty-icon">⏳</div><p>Se încarcă...</p></div></div>;
  if (error)   return <div className="page"><div className="alert alert-error">{error}</div><button className="btn btn-ghost" onClick={() => navigate("/")}>← Dashboard</button></div>;
  if (!decl)   return null;

  const rezervariFormatted = decl.rezervari?.map((r) => ({
    ...r,
    check_in: r.check_in,
    check_out: r.check_out,
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">
          📄 {LUNI[decl.luna]} {decl.an} — {decl.proprietate_nume}
        </h1>
        <button className="btn btn-ghost" onClick={() => navigate("/")}>← Dashboard</button>
      </div>

      {/* Sumar */}
      <div className="summary-grid">
        <div className="summary-box">
          <div className="label">Total nopți</div>
          <div className="value">{decl.total_nopti}</div>
        </div>
        <div className="summary-box">
          <div className="label">Nopți × Pers</div>
          <div className="value">{decl.total_persoane_zile}</div>
        </div>
        <div className="summary-box">
          <div className="label">Taxă totală</div>
          <div className="value">{decl.taxa_totala} <span className="unit">RON</span></div>
        </div>
        <div className="summary-box">
          <div className="label">Status</div>
          <div style={{ marginTop: 6 }}><StatusBadge status={decl.status} /></div>
        </div>
      </div>

      {/* Detalii */}
      <div className="card">
        <div className="card-title">ℹ️ Informații</div>
        <table style={{ width: "auto" }}>
          <tbody>
            <tr><td style={{ paddingRight: 24, color: "#6b7fa8", paddingBottom: 6 }}>Data generării</td><td>{fmt(decl.data_generare)}</td></tr>
            <tr><td style={{ color: "#6b7fa8", paddingBottom: 6 }}>PDF declarație</td>
              <td>
                {decl.pdf_path
                  ? <><code style={{ fontSize: 11 }}>{decl.pdf_path}</code>
                    {" "}<a href={`/api/declaratii/${id}/download`} className="btn btn-outline btn-sm" style={{ marginLeft: 8 }}>⬇ Descarcă</a></>
                  : "—"}
              </td>
            </tr>
            <tr><td style={{ color: "#6b7fa8" }}>Folder output</td>
              <td>
                {decl.folder_output
                  ? <><code style={{ fontSize: 11 }}>{decl.folder_output}</code>
                    {" "}<button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={() => window.open(`/api/declaratii/${id}/folder`, "_blank")}>📁 Deschide</button></>
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rezervări */}
      <div className="card">
        <div className="card-title">🏨 Rezervări ({decl.rezervari?.length ?? 0})</div>
        <RezervariNoi rezervari={rezervariFormatted} />
      </div>

      {/* Acțiuni */}
      <div className="card">
        <div className="card-title">⚡ Acțiuni</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {decl.status !== "depus" && (
            <button className="btn btn-success" onClick={marcheazaDepus} disabled={loadingStatus}>
              {loadingStatus ? <><span className="spinner" /> Se salvează...</> : "✅ Marchează ca depus"}
            </button>
          )}
          {decl.folder_output && (
            <button className="btn btn-outline" onClick={() => window.open(`/api/declaratii/${id}/folder`, "_blank")}>
              📁 Deschide folder
            </button>
          )}
          {decl.pdf_path && (
            <a href={`/api/declaratii/${id}/download`} className="btn btn-ghost">
              ⬇ Descarcă PDF
            </a>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={loadingDelete} style={{ marginLeft: "auto" }}>
            {loadingDelete ? "Se șterge..." : "🗑 Șterge din DB"}
          </button>
        </div>
        {decl.status === "depus" && (
          <div className="alert alert-success" style={{ marginTop: 14, marginBottom: 0 }}>
            ✅ Declarație marcată ca depusă.
          </div>
        )}
        {decl.status === "generat" && (
          <div className="alert alert-info" style={{ marginTop: 14, marginBottom: 0 }}>
            💡 După depunerea pe <strong>start.ps4.ro</strong>, marchează declarația ca „Depus".
          </div>
        )}
      </div>
    </div>
  );
}
