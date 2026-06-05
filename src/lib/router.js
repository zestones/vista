import { useEffect, useState } from "react";

// Minimal hash router — no dependency, refresh-safe.
// Routes: "/", "/login", "/signup", "/app".

export function currentPath() {
  const h = window.location.hash.replace(/^#/, "");
  return h || "/";
}

export function navigate(path) {
  if (currentPath() === path) return;
  window.location.hash = path;
}

export function useRoute() {
  const [path, setPath] = useState(currentPath());
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return path;
}

// Remember where the user was heading when bounced to login.
let _redirect = null;
export function setRedirect(path) {
  _redirect = path;
}
export function takeRedirect() {
  const r = _redirect;
  _redirect = null;
  return r;
}

export function segments(path) {
  return path.split("/").filter(Boolean);
}
