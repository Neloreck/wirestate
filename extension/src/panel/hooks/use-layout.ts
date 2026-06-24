import { useEffect, useRef, useState } from "react";

import { type Nullable } from "@/types/general";

const DEVTOOLS_LAYOUT_STORAGE_KEY: string = "wirestate.devtools.layout";

/**
 * Spatial layout of the panel: panel sizes (as fractions of their container) + timeline state.
 */
export interface PanelLayout {
  readonly navFraction: number;
  readonly timelineFraction: number;
  readonly isTimelineOpen: boolean;
}

/**
 * Stable API over the layout state. Sizes commit on drag release.
 * Toggle flips the dock.
 */
export interface PanelLayoutActions {
  setNavFraction(fraction: number): void;
  setTimelineFraction(fraction: number): void;
  toggleTimeline(): void;
}

/**
 * Owns the panel's spatial layout and persists it to `chrome.storage.local`.
 *
 * @returns The current layout and a stable actions API for resizing the panes and toggling the dock.
 */
export function useLayout(): { layout: PanelLayout; actions: PanelLayoutActions } {
  const [layout, setLayout] = useState<PanelLayout>(() => ({
    navFraction: 0.4,
    timelineFraction: 0.4,
    isTimelineOpen: true,
  }));

  const isHydratedRef = useRef<boolean>(false);

  useEffect(() => {
    const storage: Nullable<chrome.storage.StorageArea> = chrome.storage?.local;

    // No `storage` permission / API unavailable — run session-only rather than crash the panel.
    if (!storage) {
      isHydratedRef.current = true;

      return;
    }

    let cancelled: boolean = false;

    storage
      .get(DEVTOOLS_LAYOUT_STORAGE_KEY)
      .then((stored) => {
        if (cancelled) {
          return;
        }

        const saved = stored[DEVTOOLS_LAYOUT_STORAGE_KEY] as Partial<PanelLayout> | undefined;

        if (saved) {
          setLayout((current) => ({ ...current, ...saved }));
        }
      })
      .catch(() => {
        /* Storage unavailable (e.g. permissions) — fall back to in-memory defaults. */
      })
      .finally(() => {
        if (!cancelled) {
          isHydratedRef.current = true;
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const storage: Nullable<chrome.storage.StorageArea> = chrome.storage?.local;

    if (!isHydratedRef.current || !storage) {
      return;
    }

    storage.set({ [DEVTOOLS_LAYOUT_STORAGE_KEY]: layout }).catch(() => {
      /* Storage unavailable (e.g. permissions) — safe to fail. */
    });
  }, [layout]);

  const actions: PanelLayoutActions = useRef<PanelLayoutActions>({
    setNavFraction: (navFraction) => setLayout((current) => ({ ...current, navFraction })),
    setTimelineFraction: (timelineFraction) => setLayout((current) => ({ ...current, timelineFraction })),
    toggleTimeline: () => setLayout((current) => ({ ...current, isTimelineOpen: !current.isTimelineOpen })),
  }).current;

  return { layout, actions };
}
