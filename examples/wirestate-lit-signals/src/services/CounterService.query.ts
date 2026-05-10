export enum ECounterServiceQuery {
  GET_COUNTER_SUMMARY = "counter/summary",
  FETCH_COUNTER_SNAPSHOT = "counter/snapshot",
}

export interface ICounterSummary {
  readonly count: number;
  readonly lastIncrementedAt: number;
}

export interface ICounterSnapshot extends ICounterSummary {
  readonly fetchedAt: number;
}
