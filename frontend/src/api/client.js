export const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5016");

// Identifie ce front auprès de l'API : choisit le cookie de session "client" (et non "admin"),
// et sert de protection CSRF (le backend refuse toute écriture sans cet en-tête).
const APP = "client";
const SESSION_KEY = "chomatech-client-session";

// Le jeton de connexion vit dans un cookie HttpOnly posé par l'API : JavaScript ne peut ni le
// lire ni le voler (même en cas de faille XSS). On ne garde ici que des infos d'affichage
// (profil + date d'expiration), sans aucune valeur d'authentification.

// Nettoyage des anciennes versions qui stockaient le jeton lui-même dans le navigateur.
for (const stockage of [localStorage, sessionStorage]) {
  stockage.removeItem("chomatech-client-token");
  stockage.removeItem("chomatech-client-user");
}

// Les URLs d'images renvoyées par le backend sont relatives (ex. "/uploads/produits/xxx.jpg") :
// il faut préfixer l'origine de l'API pour les afficher, car le front tourne sur un autre port.
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path}`;
}

// "Se souvenir de moi" : localStorage (survit à la fermeture du navigateur, comme le cookie
// persistant) ; sinon sessionStorage (effacé à la fermeture, comme le cookie de session).
function lireSession() {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Profil de l'utilisateur connecté, ou null si pas de session (ou session expirée).
export function getStoredUser() {
  const session = lireSession();
  if (!session?.user) return null;
  if (
    !session.expiration ||
    new Date(session.expiration).getTime() <= Date.now()
  ) {
    clearSession();
    return null;
  }
  return session.user;
}

export function setSession(user, expiration, remember) {
  clearSession();
  const stockage = remember ? localStorage : sessionStorage;
  stockage.setItem(SESSION_KEY, JSON.stringify({ user, expiration }));
}

// Mise à jour du profil affiché sans toucher à la durée ni au type de stockage de la session.
export function updateStoredUser(user) {
  const session = lireSession();
  if (!session) return;
  const stockage =
    localStorage.getItem(SESSION_KEY) !== null ? localStorage : sessionStorage;
  stockage.setItem(SESSION_KEY, JSON.stringify({ ...session, user }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function handleUnauthorized() {
  clearSession();
  if (window.location.pathname !== "/authentification") {
    window.location.href = "/authentification";
  }
}

export async function apiFetch(path, options = {}) {
  const avaitSession = getStoredUser() !== null;
  const headers = {
    "Content-Type": "application/json",
    "X-Chomatech-App": APP,
    ...options.headers,
  };

  try {
    // credentials: 'include' : envoie le cookie de session à l'API (autre origine que le front).
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401 && avaitSession) {
      handleUnauthorized();
      throw new Error("Session expirée, veuillez vous reconnecter.");
    }

    if (response.status === 204) return null;

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMessage =
        data?.error || data?.message || `Erreur ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "TypeError") {
      throw new Error(
        "Impossible de joindre le serveur. Vérifiez votre connexion ou réessayez.",
        { cause: error },
      );
    }
    throw error;
  }
}
