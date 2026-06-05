import { createContext, createElement, useContext, useEffect, useState } from "react";

// ⚠ FRONT-END MOCK ONLY — no real backend / security yet.
// Sessions live in localStorage; any email + password is accepted.
// Swap this module for a real auth provider when infra is ready.

const SESSION_KEY = "vista-session";
const ACCOUNTS_KEY = "vista-accounts";

const AuthContext = createContext(null);

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || {};
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  const signup = ({ name, email }) => {
    const key = email.trim().toLowerCase();
    const accounts = readAccounts();
    accounts[key] = { name: name.trim(), email: key };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    const u = { name: name.trim(), email: key };
    setUser(u);
    return u;
  };

  const login = ({ email }) => {
    const key = email.trim().toLowerCase();
    const existing = readAccounts()[key];
    const u = { name: existing?.name || key.split("@")[0], email: key };
    setUser(u);
    return u;
  };

  const logout = () => setUser(null);

  return createElement(
    AuthContext.Provider,
    { value: { user, isAuthed: !!user, signup, login, logout } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
