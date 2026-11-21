import { useEffect, useState } from 'react'
import { apiFetch } from './client'

// Coordonnées de l'entreprise saisies dans l'admin (Paramètres). Une seule requête partagée
// par tous les composants de la page (footer + contact), au lieu d'un appel chacun.
let requete = null

function getParametres () {
  if (!requete) {
    requete = apiFetch('/api/parametres').catch(err => {
      requete = null // réessaiera au prochain montage
      throw err
    })
  }
  return requete
}

// Renvoie null tant que non chargé (ou en cas d'erreur) : les composants gardent alors
// leurs valeurs par défaut.
export function useParametres () {
  const [parametres, setParametres] = useState(null)

  useEffect(() => {
    let annule = false
    getParametres()
      .then(data => {
        if (!annule) setParametres(data)
      })
      .catch(() => {})
    return () => {
      annule = true
    }
  }, [])

  return parametres
}
