import { useCallback, useEffect, useRef } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { apiFetch } from "../lib/apiClient";

function makeId(prefix) {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-4)}${rand}`;
}

/**
 * useEntityStore
 * Every module (projects, units, construction stages, workforce,
 * materials, ...) reads/writes through this one hook. localStorage is
 * kept as a fast local cache — reads return instantly and the app still
 * works if the API is briefly unreachable — but the real source of
 * truth is the SiteFlow API: on mount it fetches the collection from
 * the server, and every add/update/remove writes through to the server
 * in the background. Adds stay synchronous (id assigned client-side,
 * same as before) so nothing else in the app had to change to pick up
 * real backend persistence.
 */
export function useEntityStore(storageKey, idPrefix) {
  const [records, setRecords] = useLocalStorage(storageKey, []);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    apiFetch(`/collections/${storageKey}`)
      .then((data) => {
        if (data?.records) setRecords(data.records);
      })
      .catch(() => {
        // Not signed in yet, or the API isn't reachable — keep working
        // from whatever is already cached locally.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const add = useCallback(
    (record) => {
      const withId = { id: makeId(idPrefix), createdAt: new Date().toISOString(), ...record };
      setRecords((prev) => [...prev, withId]);
      apiFetch(`/collections/${storageKey}`, { method: "POST", body: withId }).catch(() => {});
      return withId;
    },
    [idPrefix, setRecords, storageKey]
  );

  const update = useCallback(
    (id, patch) => {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      apiFetch(`/collections/${storageKey}/${id}`, { method: "PATCH", body: patch }).catch(() => {});
    },
    [setRecords, storageKey]
  );

  const remove = useCallback(
    (id) => {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      apiFetch(`/collections/${storageKey}/${id}`, { method: "DELETE" }).catch(() => {});
    },
    [setRecords, storageKey]
  );

  return { records, add, update, remove };
}
