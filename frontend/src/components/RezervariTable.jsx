const LUNI = ["", "Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function RezervariNoi({ rezervari }) {
  if (!rezervari?.length) return (
    <div className="empty"><div className="empty-icon">📭</div><p>Nicio rezervare nouă.</p></div>
  );

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nr. rezervare</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Persoane</th>
            <th>Nopți în lună</th>
            <th>Taxă</th>
          </tr>
        </thead>
        <tbody>
          {rezervari.map((r) => (
            <tr key={r.booking_id}>
              <td><code style={{ fontSize: 12 }}>{r.booking_id}</code></td>
              <td>{fmt(r.check_in)}</td>
              <td>{fmt(r.check_out)}</td>
              <td>{r.persoane}</td>
              <td><strong>{r.nopti_in_luna}</strong></td>
              <td><strong>{r.taxa_aferenta} RON</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RezervariDuplicate({ rezervari }) {
  if (!rezervari?.length) return null;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nr. rezervare</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Declarată în</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rezervari.map((r) => (
            <tr key={r.booking_id}>
              <td><code style={{ fontSize: 12 }}>{r.booking_id}</code></td>
              <td>{fmt(r.check_in)}</td>
              <td>{fmt(r.check_out)}</td>
              <td>
                {r.declaratie_luna && r.declaratie_an
                  ? `${LUNI[r.declaratie_luna]} ${r.declaratie_an}`
                  : "—"}
              </td>
              <td>
                <span className={`badge badge-${r.status_declaratie ?? "draft"}`}>
                  {r.status_declaratie === "depus" ? "✅ Depus"
                    : r.status_declaratie === "generat" ? "📄 Generat"
                    : "⏳ Draft"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
