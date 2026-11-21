import { createContext, useContext, useState } from 'react'
import { login as loginRequest, logout as logoutRequest } from '../api/auth'
import { getStoredUser, setSession, clearSession } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider ({ children }) {
  // Le jeton est dans un cookie HttpOnly (illisible ici) : on suit seulement le profil connecté.
  const [user, setUser] = useState(() => getStoredUser())

  async function login (email, password) {
    // Le backend refuse lui-même (403) d'ouvrir une session d'administration pour un compte
    // non-Admin : ce contrôle-ci n'est qu'un message plus clair.
    const result = await loginRequest(email, password)
    if (result.utilisateur?.role !== 'Admin') {
      throw new Error("Ce compte n'a pas accès à l'administration.")
    }

    setSession(result.utilisateur, result.expiration)
    setUser(result.utilisateur)
    return result.utilisateur
  }

  function logout () {
    // Le cookie HttpOnly ne peut être effacé que par le serveur.
    logoutRequest().catch(() => {})
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth () {
  return useContext(AuthContext)
}
