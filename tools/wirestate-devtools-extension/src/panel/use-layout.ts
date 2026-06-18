import { useEffect, useRef, useState } from "react";

import { type Nullable } from "@/types/general";

/** Spatial layout of the panel: pane sizes (as fractions of their container) + Timeline open state. */
export interface PanelLayout {
  /** Navigator width as a fraction (0–1) of the master/detail row. */
  readonly navFraction: number;
  /** Timeline dock height as a fraction (0–1) of the panel column. */
  readonly timelineFraction: number;
  readonly timelineOpen: boolean;
}

const DEFAULTS: PanelLayout = { navFraction: 0.42, timelineFraction: 0.4, timelineOpen: true };

const STORAGE_KEY = "wirestate.devtools.layout";

/** Stable API over the layout state. Sizes commit on drag release; toggle flips the dock. */
export interface LayoutActions {
  setNavFraction(fraction: number): void;
  setTimelineFraction(fraction: number): void;
  toggleTimeline(): void;
}

/**
 * Owns the panel's spatial layout and persists it to `chrome.storage.local`.
 *
 * Load is a guarded mount effect (a late resolve after unmount is ignored); first paint uses
 * DEFAULTS and snaps once when storage resolves. Save is a separate effect gated on `hydrated`, so
 * the initial default render never clobbers a saved layout before the load lands. Actions are pure
 * functional updaters — no I/O in the reducer path — keeping the effect the single writer.
 */
export function useLayout(): { layout: PanelLayout; actions: LayoutActions } {
  const [layout, setLayout] = useState<PanelLayout>(DEFAULTS);
  const hydrated = useRef<boolean>(false);

  useEffect(() => {
    const storage: Nullable<chrome.storage.StorageArea> = chrome.storage?.local;

    if (!storage) {
      // No `storage` permission / API unavailable — run session-only rather than crash the panel.
      hydrated.current = true;

      return;
    }

    let ignore = false;

    storage
      .get(STORAGE_KEY)
      .then((stored) => {
        if (ignore) {
          return;
        }

        const saved = stored[STORAGE_KEY] as Partial<PanelLayout> | undefined;

        if (saved) {
          setLayout((current) => ({ ...current, ...saved }));
        }
      })
      .catch(() => {
        // Storage unavailable (e.g. permissions) — fall back to in-memory defaults.
      })
      .finally(() => {
        if (!ignore) {
          hydrated.current = true;
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const storage: Nullable<chrome.storage.StorageArea> = chrome.storage?.local;

    if (!hydrated.current || !storage) {
      return;
    }

    storage.set({ [STORAGE_KEY]: layout }).catch(() => {
      // Best-effort persistence; a failed write just means this session won't be remembered.
    });
  }, [layout]);

  const actions: LayoutActions = useRef<LayoutActions>({
    setNavFraction: (navFraction) => setLayout((current) => ({ ...current, navFraction })),
    setTimelineFraction: (timelineFraction) => setLayout((current) => ({ ...current, timelineFraction })),
    toggleTimeline: () => setLayout((current) => ({ ...current, timelineOpen: !current.timelineOpen })),
  }).current;

  return { layout, actions };
}
