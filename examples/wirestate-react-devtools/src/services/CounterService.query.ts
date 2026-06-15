import type { Nullable } from "@/types";

export enum ECounterServiceQuery {
  GET_COUNTER_SUMMARY = "counter/summary",
  FETCH_COUNTER_SNAPSHOT = "counter/snapshot",
}

export interface ICounterSummary {
  readonly count: number;
  readonly isEven: boolean;
  readonly lastIncrementAt: Nullable<number>;
}

export interface ICounterSnapshot extends ICounterSummary {
  readonly fetchedAt: number;
}
