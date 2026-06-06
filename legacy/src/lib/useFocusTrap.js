import { useEffect } from "react";

const SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keep Tab focus inside `ref` while `active`. Lightweight, no dependency.
export function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const node = ref.current;
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const items = [...node.querySelectorAll(SELECTOR)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [ref, active]);
}
