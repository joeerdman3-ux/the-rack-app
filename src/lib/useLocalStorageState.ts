import { useCallback, useSyncExternalStore } from "react";

// Minimal external store per key so multiple hook instances (or a future
// second consumer) watching the same key stay in sync with each other.
const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, callback: () => void): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  const set = listeners.get(key)!;
  set.add(callback);
  return () => set.delete(callback);
}

function emit(key: string) {
  listeners.get(key)?.forEach((callback) => callback());
}

// SSR-safe localStorage-backed state: useSyncExternalStore returns
// `fallback` for both the server render and the client's first
// (pre-hydration) render — matching exactly, so there's no hydration
// mismatch — then switches to the real stored value right after
// hydration. Deliberately not a plain useState+useEffect pair: writing to
// localStorage from inside an effect body means calling setState
// synchronously in that same effect to reflect a restored value, which is
// exactly the anti-pattern react-hooks/set-state-in-effect flags: this
// hook's setValue instead updates localStorage directly, which
// useSyncExternalStore is designed to keep in sync with no explicit
// setState call.
export function useLocalStorageState(
  key: string,
  fallback: string,
): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    (callback) => subscribe(key, callback),
    () => localStorage.getItem(key) ?? fallback,
    () => fallback,
  );

  const setValue = useCallback(
    (next: string) => {
      localStorage.setItem(key, next);
      emit(key);
    },
    [key],
  );

  return [value, setValue];
}
