import { apiFetch } from "./client";

export function demarrerPaiementPanier({ requestKey, commande }) {
  return apiFetch("/api/paiements/panier", {
    method: "POST",
    body: JSON.stringify({ requestKey, commande }),
  });
}

export function getPaiementStatut(paiementId) {
  return apiFetch(`/api/paiements/${paiementId}/statut`);
}
