import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

const LUNI = ["", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
               "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

const STATUS_FILTERS = [
  { key: null,      label: "Toate" },
  { key: "generat", label: "📄 Generat" },
  { key: "depus",   label: "✅ Depus" },
];

export default function Dashboard() {
  const [declaratii, setDeclaratii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtruStatus, setFiltruStatus] = useState(null);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/declaratii");
      if (!res.ok) throw new Error();
      setDeclaratii(await res.json());
    } catch {
      setError("Nu s-a putut conecta la backend. Verifică că serverul rulează.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtrate = filtruStatus
    ? declaratii.filter((d) => d.status === filtruStatus)
    : declaratii;

  const totalTaxa = declaratii
    .filter((d) => d.status === "depus")
    .reduce((s, d) => s + d.taxa_totala, 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📊 Istoric declarații</h1>
        <button className="btn btn-primary" onClick={() => navigate("/rezervari")}>
          + Declarație nouă
        </button>
      </div>

      {declaratii.length > 0 && (
        <div className="summary-grid">
          <div className="summary-box">
            <div className="label">Total declarații</div>
            <div className="value">{declaratii.length}</div>
          </div>
          <div className="summary-box">
            <div className="label">Depuse</div>
            <div className="value">{declaratii.filter((d) => d.status === "depus").length}</div>
          </div>
          <div className="summary-box">
            <div className="label">Taxă depusă</div>
            <div className="value">{totalTaxa} <span className="unit">RON</span></div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={String(f.key)}
              className={`filter-btn${filtruStatus === f.key ? " active" : ""}`}
              onClick={() => setFiltruStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="empty"><div className="empty-icon">⏳</div><p>Se încarcă...</p></div>
        ) : filtrate.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>{declaratii.length === 0
              ? "Nu există declarații. Importă rezervări din pagina Rezervări."
              : "Nicio declarație cu filtrul selectat."}</p>
            {declaratii.length === 0 && (
              <button className="btn btn-primary" onClick={() => navigate("/rezervari")}>
                → Mergi la Rezervări
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Proprietate</th>
                  <th>Lună</th>
                  <th>An</th>
                  <th>Nopți</th>
                  <th>Nopți×Pers</th>
                  <th>Taxă (RON)</th>
                  <th>Status</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtrate.map((d) => (
                  <tr key={d.id}>
                    <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.proprietate_nume ?? "—"}
                    </td>
                    <td>{LUNI[d.luna]}</td>
                    <td>{d.an}</td>
                    <td>{d.total_nopti}</td>
                    <td>{d.total_persoane_zile}</td>
                    <td><strong>{d.taxa_totala} RON</strong></td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/declaratii/${d.id}`)}>
                          Detalii
                        </button>
                        {d.folder_output && (
                          <button className="btn btn-ghost btn-sm" onClick={() => window.open(`/api/declaratii/${d.id}/folder`, "_blank")}>
                            📁 Folder
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
