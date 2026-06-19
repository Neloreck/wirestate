import { type DevtoolsMessageChannel } from "@wirestate/core/devtools";
import { useMemo, useReducer } from "react";

import { type EventKind, type Selection, type TimelineFilter } from "@/panel/types";
import { type Optional } from "@/types/general";

/** Panel-local view preferences (not data — data lives in the bridge). */
export interface PanelUi {
  readonly paused: boolean;
  readonly autoscroll: boolean;
  readonly collapsed: ReadonlySet<number>;
}

/** All panel UI state: what's selected, how the Timeline is filtered, and view prefs. */
export interface PanelState {
  readonly selection: Optional<Selection>;
  readonly filter: TimelineFilter;
  readonly ui: PanelUi;
}

type Action =
  | { type: "select"; selection: Selection }
  | { type: "clearSelection" }
  | { type: "setRootFilter"; rootId: Optional<number> }
  | { type: "setContainerFilter"; containerId: Optional<number> }
  | { type: "toggleKind"; kind: EventKind }
  | { type: "toggleChannel"; channel: DevtoolsMessageChannel }
  | { type: "setText"; text: string }
  | { type: "togglePaused" }
  | { type: "toggleAutoscroll" }
  | { type: "toggleCollapsed"; containerId: number };

const initialState: PanelState = {
  selection: undefined,
  filter: {
    rootId: undefined,
    containerId: undefined,
    kinds: { lifecycle: true, message: true, registration: true },
    channels: { event: true, command: true, query: true },
    text: "",
  },
  ui: { paused: false, autoscroll: true, collapsed: new Set<number>() },
};

function reducer(state: PanelState, action: Action): PanelState {
  switch (action.type) {
    case "select":
      return { ...state, selection: action.selection };
    case "clearSelection":
      return { ...state, selection: undefined };
    case "setRootFilter":
      return { ...state, filter: { ...state.filter, rootId: action.rootId } };
    case "setContainerFilter":
      return { ...state, filter: { ...state.filter, containerId: action.containerId } };
    case "toggleKind":
      return {
        ...state,
        filter: { ...state.filter, kinds: { ...state.filter.kinds, [action.kind]: !state.filter.kinds[action.kind] } },
      };
    case "toggleChannel":
      return {
        ...state,
        filter: {
          ...state.filter,
          channels: { ...state.filter.channels, [action.channel]: !state.filter.channels[action.channel] },
        },
      };
    case "setText":
      return { ...state, filter: { ...state.filter, text: action.text } };
    case "togglePaused":
      return { ...state, ui: { ...state.ui, paused: !state.ui.paused } };
    case "toggleAutoscroll":
      return { ...state, ui: { ...state.ui, autoscroll: !state.ui.autoscroll } };
    case "toggleCollapsed": {
      const collapsed: Set<number> = new Set(state.ui.collapsed);

      if (collapsed.has(action.containerId)) {
        collapsed.delete(action.containerId);
      } else {
        collapsed.add(action.containerId);
      }

      return { ...state, ui: { ...state.ui, collapsed } };
    }
    default:
      return state;
  }
}

/** Stable callback API over the panel reducer. */
export interface PanelActions {
  select(selection: Selection): void;
  clearSelection(): void;
  setRootFilter(rootId: Optional<number>): void;
  setContainerFilter(containerId: Optional<number>): void;
  toggleKind(kind: EventKind): void;
  toggleChannel(channel: DevtoolsMessageChannel): void;
  setText(text: string): void;
  togglePaused(): void;
  toggleAutoscroll(): void;
  toggleCollapsed(containerId: number): void;
}

/**
 * Owns the panel's UI state (selection, Timeline filter, view prefs).
 *
 * @returns Todo;.
 */
export function usePanelState(): { state: PanelState; actions: PanelActions } {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions: PanelActions = useMemo(
    () => ({
      select: (selection) => dispatch({ type: "select", selection }),
      clearSelection: () => dispatch({ type: "clearSelection" }),
      setRootFilter: (rootId) => dispatch({ type: "setRootFilter", rootId }),
      setContainerFilter: (containerId) => dispatch({ type: "setContainerFilter", containerId }),
      toggleKind: (kind) => dispatch({ type: "toggleKind", kind }),
      toggleChannel: (channel) => dispatch({ type: "toggleChannel", channel }),
      setText: (text) => dispatch({ type: "setText", text }),
      togglePaused: () => dispatch({ type: "togglePaused" }),
      toggleAutoscroll: () => dispatch({ type: "toggleAutoscroll" }),
      toggleCollapsed: (containerId) => dispatch({ type: "toggleCollapsed", containerId }),
    }),
    []
  );

  return { state, actions };
}
