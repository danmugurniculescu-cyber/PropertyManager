const LABELS = {
  generat: "📄 Generat",
  depus:   "✅ Depus",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
