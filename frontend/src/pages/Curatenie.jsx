import { useEffect, useState } from "react";

const LUNI = ["", "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
               "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

const azi = new Date();

function fmt(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function SursaBadge({ sursa }) {
  if (!sursa || sursa === "booking") return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, background: "#dbeafe", color: "#1e40af", marginLeft: 5 }}>BK</span>
  );
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, background: "#fff7ed", color: "#9a3412", marginLeft: 5 }}>AB</span>
  );
}

function ziSapt(iso) {
  if (!iso) return "";
  const zile = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];
  return zile[new Date(iso).getDay()];
}

function IntervalCard({ item, urmatoarea }) {
  const urgent = item.urgent;
  const faraPresiune = item.zile_disponibile === null;
  const zile = item.zile_disponibile;

  let borderColor, bg, badgeBg, badgeColor, badgeText;
  if (urgent) {
    borderColor = "#f59e0b"; bg = "#fffbeb";
    badgeBg = "#fef3c7"; badgeColor = "#92400e";
    badgeText = "⚡ Aceeași zi";
  } else if (faraPresiune) {
    borderColor = "#a3e635"; bg = "#f7fee7";
    badgeBg = "#ecfccb"; badgeColor = "#3f6212";
    badgeText = "✅ Fără termen";
  } else if (zile === 1) {
    borderColor = "#fb923c"; bg = "#fff7ed";
    badgeBg = "#ffedd5"; badgeColor = "#9a3412";
    badgeText = "⚠️ 1 zi";
  } else {
    borderColor = "#4ade80"; bg = "#f0fdf4";
    badgeBg = "#dcfce7"; badgeColor = "#15803d";
    badgeText = `✅ ${zile} zile`;
  }

  return (
    <div style={{
      border: `2px solid ${urmatoarea ? "#6366f1" : borderColor}`, borderRadius: 10,
      background: bg, marginBottom: 12, overflow: "hidden",
      boxShadow: urmatoarea ? "0 0 0 3px rgba(99,102,241,0.2)" : undefined,
    }}>
      {/* Banner "urmează" */}
      {urmatoarea && (
        <div style={{
          background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "4px 16px", letterSpacing: ".4px",
        }}>
          📍 URMĂTOAREA CURĂȚENIE
        </div>
      )}
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🧹</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a3a6b" }}>
              {fmt(item.checkout)}
              <span style={{ fontSize: 12, color: "#6b7fa8", fontWeight: 400, marginLeft: 6 }}>
                {ziSapt(item.checkout)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#6b7fa8" }}>
              Interval curățenie
            </div>
          </div>
        </div>
        <span style={{
          background: badgeBg, color: badgeColor,
          borderRadius: 20, padding: "4px 12px",
          fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
        }}>
          {badgeText}
        </span>
      </div>

      {/* Detalii */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center", gap: 8, padding: "10px 16px 14px",
        borderTop: `1px solid ${borderColor}`,
      }}>
        {/* Pleacă */}
        <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>
            ↗ Pleacă
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
            {item.guest_out || <span style={{ color: "#9ca3af" }}>—</span>}
            <SursaBadge sursa={item.sursa_out} />
          </div>
          <div style={{ fontSize: 11, color: "#6b7fa8", marginTop: 2 }}>
            Checkout: <strong>{fmt(item.checkout)}</strong>
          </div>
          <code style={{ fontSize: 10, color: "#9ca3af" }}>{item.booking_out}</code>
        </div>

        {/* Săgeată mijloc */}
        <div style={{ textAlign: "center", fontSize: 18, color: borderColor }}>
          {faraPresiune ? "→" : urgent ? "⚡" : "→"}
          {!faraPresiune && zile !== null && (
            <div style={{ fontSize: 10, color: "#6b7fa8", fontWeight: 600, marginTop: 2 }}>
              {zile === 0 ? "0 zile" : `${zile}z`}
            </div>
          )}
        </div>

        {/* Vine */}
        <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "10px 12px" }}>
          {item.checkin_urmator ? (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>
                ↙ Vine
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>
                {item.guest_in || <span style={{ color: "#9ca3af" }}>—</span>}
                <SursaBadge sursa={item.sursa_in} />
              </div>
              <div style={{ fontSize: 11, color: "#6b7fa8", marginTop: 2 }}>
                Check-in: <strong>{fmt(item.checkin_urmator)}</strong>
                <span style={{ marginLeft: 6, color: "#9ca3af" }}>{ziSapt(item.checkin_urmator)}</span>
              </div>
              <code style={{ fontSize: 10, color: "#9ca3af" }}>{item.booking_in}</code>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>
                ↙ Vine
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
                Nicio rezervare ulterioară
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Curatenie() {
  const [proprietati, setProprietati] = useState([]);
  const [proprietateId, setProprietateId] = useState("");
  const [luna, setLuna] = useState(azi.getMonth() + 1);
  const [an, setAn] = useState(azi.getFullYear());
  const [arataSiUrmatoarea, setArataSiUrmatoarea] = useState(true);
  const [data, setData] = useState(null);
  const [dataUrmatoare, setDataUrmatoare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/proprietati").then((r) => r.json()).then((d) => {
      setProprietati(d);
      if (d.length > 0) setProprietateId(String(d[0].id));
    });
  }, []);

  useEffect(() => {
    if (proprietateId) load();
  }, [proprietateId, luna, an]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/curatenie?proprietate_id=${proprietateId}&luna=${luna}&an=${an}`),
        arataSiUrmatoarea
          ? fetch(`/api/curatenie?proprietate_id=${proprietateId}&luna=${lunaUrmatoare().luna}&an=${lunaUrmatoare().an}`)
          : Promise.resolve(null),
      ]);
      setData(await r1.json());
      setDataUrmatoare(r2 ? await r2.json() : null);
    } catch {
      setError("Nu s-a putut încărca lista.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (proprietateId) load(); }, [arataSiUrmatoarea]);

  function lunaUrmatoare() {
    return luna === 12 ? { luna: 1, an: an + 1 } : { luna: luna + 1, an };
  }

  const intervale = data?.intervale ?? [];
  const intervaleUrm = dataUrmatoare?.intervale ?? [];
  const toateIntervalele = arataSiUrmatoarea ? [...intervale, ...intervaleUrm] : intervale;

  const urgente = toateIntervalele.filter((i) => i.urgent).length;
  const unZi = toateIntervalele.filter((i) => i.zile_disponibile === 1).length;
  const normale = toateIntervalele.filter((i) => !i.urgent && i.zile_disponibile !== 1).length;

  const aziStr = new Date().toISOString().slice(0, 10);
  let urmatoareaGasita = false;
  function cardCuFlag(item, key) {
    const eUrmatoarea = !urmatoareaGasita && item.checkout >= aziStr;
    if (eUrmatoarea) urmatoareaGasita = true;
    return <IntervalCard key={key} item={item} urmatoarea={eUrmatoarea} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🧹 Curățenie</h1>
        {proprietati.length > 1 && (
          <select value={proprietateId} onChange={(e) => { setProprietateId(e.target.value); }}
            style={{ padding: "6px 10px", borderRadius: 7, border: "1.5px solid #d1d9ee", fontSize: 13 }}>
            {proprietati.map((p) => <option key={p.id} value={p.id}>{p.nume}</option>)}
          </select>
        )}
      </div>

      {/* Selector lună */}
      <div className="card" style={{ borderTop: "3px solid #4ade80" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Luna</label>
            <select value={luna} onChange={(e) => setLuna(Number(e.target.value))}
              style={{ padding: "6px 10px", borderRadius: 7, border: "1.5px solid #d1d9ee", fontSize: 13 }}>
              {LUNI.slice(1).map((l, i) => (
                <option key={i + 1} value={i + 1}>{l}</option>
              ))}
            </select>
            <input type="number" value={an} min={2024} max={2099}
              onChange={(e) => setAn(Number(e.target.value))}
              style={{ width: 78, padding: "6px 8px", borderRadius: 7, border: "1.5px solid #d1d9ee", fontSize: 13 }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={arataSiUrmatoarea}
              onChange={(e) => setArataSiUrmatoarea(e.target.checked)} />
            Afișează și luna {LUNI[lunaUrmatoare().luna]}
          </label>
        </div>
      </div>

      {/* Sumar */}
      {toateIntervalele.length > 0 && (
        <div className="summary-grid">
          <div className="summary-box" style={{ borderLeft: "4px solid #f59e0b" }}>
            <div className="label">⚡ Aceeași zi</div>
            <div className="value" style={{ color: "#92400e" }}>{urgente}</div>
          </div>
          <div className="summary-box" style={{ borderLeft: "4px solid #fb923c" }}>
            <div className="label">⚠️ 1 zi</div>
            <div className="value" style={{ color: "#9a3412" }}>{unZi}</div>
          </div>
          <div className="summary-box" style={{ borderLeft: "4px solid #4ade80" }}>
            <div className="label">✅ 2+ zile</div>
            <div className="value" style={{ color: "#15803d" }}>{normale}</div>
          </div>
          <div className="summary-box">
            <div className="label">Total</div>
            <div className="value">{toateIntervalele.length}</div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="empty"><div className="empty-icon">⏳</div><p>Se încarcă...</p></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : toateIntervalele.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">🧹</div>
            <p>Nu există intervale de curățenie pentru perioada selectată.</p>
          </div>
        </div>
      ) : (
        <>
          {intervale.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a3a6b", marginBottom: 10 }}>
                📅 {LUNI[luna]} {an} — {intervale.length} intervenții
              </div>
              {intervale.map((item, i) => cardCuFlag(item, i))}
            </>
          )}
          {arataSiUrmatoarea && intervaleUrm.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a3a6b", margin: "20px 0 10px" }}>
                📅 {LUNI[lunaUrmatoare().luna]} {lunaUrmatoare().an} — {intervaleUrm.length} intervenții
              </div>
              {intervaleUrm.map((item, i) => cardCuFlag(item, `u${i}`))}
            </>
          )}
        </>
      )}
    </div>
  );
}
