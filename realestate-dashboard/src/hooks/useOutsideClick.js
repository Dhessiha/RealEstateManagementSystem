import { useEffect } from "react";

/** Calls `onOutside` when a pointer event lands outside `ref.current`. */
export function useOutsideClick(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutside(event);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [ref, onOutside, active]);
}
