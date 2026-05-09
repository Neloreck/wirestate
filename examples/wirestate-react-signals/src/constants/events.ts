import { type Event } from "@wirestate/core";

export enum EGlobalEvent {
  COUNTER_INCREMENTED = "counter/incremented",
  COUNTER_RESET = "counter/reset",
  THEME_TOGGLED = "theme/toggled",
  USER_PINGED = "user/pinged",
}

export interface ICounterIncrementedEvent extends Event {
  type: EGlobalEvent.COUNTER_INCREMENTED;
  payload: { count: number };
}

export interface ICounterResetEvent extends Event {
  type: EGlobalEvent.COUNTER_RESET;
}

export interface IThemeToggledEvent extends Event {
  type: EGlobalEvent.THEME_TOGGLED;
  payload: { theme: "light" | "dark" };
}

export interface IUserPingedEvent extends Event {
  type: EGlobalEvent.USER_PINGED;
  payload: { at: number };
}
