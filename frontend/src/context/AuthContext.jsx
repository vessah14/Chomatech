import { createContext, useContext, useState } from 'react'
import {
  login as loginRequest,
  signup as signupRequest,
  loginSocial as loginSocialRequest,
  logout as logoutRequest
} from '../api/auth'
import { getStoredUser, setSession, updateStoredUser, clearSession } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider ({ children }) {
  // Le jeton est dans un cookie HttpOnly (illisible ici) : on suit seulement le profil connecté.
  const [user, setUser] = useState(() => getStoredUser())

  function ouvrirSession (result, rememberMe) {
    setSession(result.utilisateur, result.expiration, rememberMe)
    setUser(result.utilisateur)
    return result.utilisateur
  }

  async function login (email, password, rememberMe = false) {
    return ouvrirSession(await loginRequest(email, password, rememberMe), rememberMe)
  }

  // provider : 'google' | 'facebook' ; accessToken obtenu via api/socialAuth.js.
  async function loginSocial (provider, accessToken, rememberMe = false) {
    return ouvrirSession(await loginSocialRequest(provider, accessToken, rememberMe), rememberMe)
  }

  async function signup (payload) {
    // AuthService.SignupAsync ne renvoie qu'un profil, pas de session (voir backend) :
    // on enchaîne avec un login pour obtenir une session, comme un vrai flux d'inscription.
    await signupRequest(payload)
    return login(payload.email, payload.password, true)
  }

  function logout () {
    // Le cookie HttpOnly ne peut être effacé que par le serveur.
    logoutRequest().catch(() => {})
    clearSession()
    setUser(null)
  }

  // Met à jour la session locale après une modification de profil côté serveur (PUT /api/users/me) :
  // évite de re-déclencher un login pour que la topbar/sidebar reflètent le nouveau nom/email.
  function updateUser (updatedUser) {
    updateStoredUser(updatedUser)
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), login, loginSocial, signup, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth () {
  return useContext(AuthContext)
}
