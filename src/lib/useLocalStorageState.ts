import { useCallback, useSyncExternalStore } from "react";

// Minimal external store per (storage, key) so multiple hook instances (or
// a future second consumer) watching the same key stay in sync with each
// other. Keyed by storage object too, since localStorage and sessionStorage
// are separate stores that could otherwise collide on an identical key.
const listeners = new Map<Storage, Map<string, Set<() => void>>>();

function subscribe(storage: Storage, key: string, callback: () => void): () => void {
  if (!listeners.has(storage)) listeners.set(storage, new Map());
  const byKey = listeners.get(storage)!;
  if (!byKey.has(key)) byKey.set(key, new Set());
  const set = byKey.get(key)!;
  set.add(callback);
  return () => set.delete(callback);
}

function emit(storage: Storage, key: string) {
  listeners.get(storage)?.get(key)?.forEach((callback) => callback());
}

// SSR-safe Storage-backed state: useSyncExternalStore returns `fallback`
// for both the server render and the client's first (pre-hydration)
// render — matching exactly, so there's no hydration mismatch — then
// switches to the real stored value right after hydration. Deliberately
// not a plain useState+useEffect pair: writing to storage from inside an
// effect body means calling setState synchronously in that same effect to
// reflect a restored value, which is exactly the anti-pattern
// react-hooks/set-state-in-effect flags: this hook's setValue instead
// updates storage directly, which useSyncExternalStore is designed to
// keep in sync with no explicit setState call.
function useStorageState(
  storage: () => Storage,
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    (callback) => subscribe(storage(), key, callback),
    () => storage().getItem(key) ?? fallback,
    () => fallback,
  );

  const setValue = useCallback(
    (next: string) => {
      storage().setItem(key, next);
      emit(storage(), key);
    },
    [storage, key],
  );

  return [value, setValue];
}

export function useLocalStorageState(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  return useStorageState(() => localStorage, key, fallback);
}

// sessionStorage variant — same SSR-safe behavior, but the browser clears
// it when the tab closes rather than persisting indefinitely. Used for
// state that should reset per browser session (e.g. VerifyEmailBanner's
// dismissal), not carried forever like a UI preference.
export function useSessionStorageState(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  return useStorageState(() => sessionStorage, key, fallback);
}
