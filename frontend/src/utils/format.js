export function formatPrixFcfa (montant) {
  const nombre = Number(montant)
  return Number.isFinite(nombre) ? `${nombre.toLocaleString('fr-FR')} FCFA` : '—'
}
