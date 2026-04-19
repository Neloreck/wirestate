import type { Signal } from "@/libs/wirestate";

export enum EGlobalSignal {
  COUNTER_INCREMENTED = "counter/incremented",
  COUNTER_RESET = "counter/reset",
  THEME_TOGGLED = "theme/toggled",
  USER_PINGED = "user/pinged",
  DUMP = "generic/dump",
}

export interface CounterIncrementedSignal extends Signal {
  type: EGlobalSignal.COUNTER_INCREMENTED;
  payload: { count: number };
}

export interface CounterResetSignal extends Signal {
  type: EGlobalSignal.COUNTER_RESET;
}

export interface ThemeToggledSignal extends Signal {
  type: EGlobalSignal.THEME_TOGGLED;
  payload: { theme: "light" | "dark" };
}

export interface UserPingedSignal extends Signal {
  type: EGlobalSignal.USER_PINGED;
  payload: { at: number };
}
