import { useCallback, useSyncExternalStore } from 'react';

function getSnapshot(mediaQueryList) {
  return mediaQueryList.matches;
}

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query) {
  const subscribe = useCallback((callback) => {
    try {
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener('change', callback);
      return () => mediaQueryList.removeEventListener('change', callback);
    } catch (e) {
      return () => {};
    }
  }, [query]);

  const matches = useSyncExternalStore(
    subscribe,
    () => {
        if (typeof window !== 'undefined') {
            return getSnapshot(window.matchMedia(query))
        }
        return false;
    },
    getServerSnapshot
  );

  return matches;
}
