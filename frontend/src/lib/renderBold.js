// Rende **parola** come <strong> — usato per descrizioni e sezioni info sconto.
export function renderBold(text) {
  if (!text) return null;
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <strong key={`b-${i}`} className="font-bold text-white">{p}</strong>
    ) : (
      p
    )
  );
}
