import { createContext, createElement, useContext, useState } from "react";

// Tiny global "data changed" signal. Components include `version` in their
// fetch effect deps and call `refresh()` after a mutation so siblings re-sync.
const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);
  return createElement(DataContext.Provider, { value: { version, refresh } }, children);
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
