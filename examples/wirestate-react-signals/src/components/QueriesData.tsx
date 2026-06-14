import "./QueriesData.css";

import {
  type AsyncQueryExecutor,
  type QueryExecutor,
  useAsyncQueryExecutor,
  useInjection,
  useQueryExecutor,
  useQueryHandler,
} from "@wirestate/react";
import { useCallback, useState } from "react";

import { EGlobalQuery } from "@/constants/queries";
import { ECounterServiceQuery, type ICounterSnapshot, type ICounterSummary } from "@/services/CounterService.query";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";
import type { Optional, Theme } from "@/types";

export function QueriesData() {
  const [snapshot, setSnapshot] = useState<Optional<ICounterSnapshot>>(null);
  const [summary, setSummary] = useState<Optional<ICounterSummary>>(null);

  const themeService: ThemeService = useInjection(ThemeService);
  const loggerService: LoggerService = useInjection(LoggerService);

  const query: QueryExecutor = useQueryExecutor();
  const queryAsync: AsyncQueryExecutor = useAsyncQueryExecutor();

  const onPullSummary = useCallback(() => {
    const value: ICounterSummary = query<ICounterSummary>(ECounterServiceQuery.GET_COUNTER_SUMMARY, {
      value: "some-data",
    });

    setSummary(value);
  }, [query]);

  const onFetchSnapshot = useCallback(async () => {
    const value: ICounterSnapshot = await queryAsync<ICounterSnapshot>(ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT);

    setSnapshot(value);

    if (loggerService) {
      loggerService.log(`[QueriesData] Fetched snapshot:`, value);
    }
  }, [queryAsync, loggerService]);

  useQueryHandler<Theme>(EGlobalQuery.GET_ACTIVE_THEME, () => themeService.theme.value);

  return (
    <div className={"queries"}>
      <div className={"query-controls"}>
        <button className={"counter ghost"} onClick={onPullSummary}>
          Query summary (sync)
        </button>

        <button className={"counter ghost"} onClick={onFetchSnapshot}>
          Fetch snapshot (async)
        </button>
      </div>

      {summary ? (
        <p className={"query-result"}>
          Summary — count: <strong>{summary.count}</strong>, parity: <strong>{summary.isEven ? "even" : "odd"}</strong>
        </p>
      ) : null}

      {snapshot ? (
        <p className={"query-result"}>
          Snapshot — count: <strong>{snapshot.count}</strong>, fetched at:{" "}
          <strong>{new Date(snapshot.fetchedAt).toLocaleTimeString()}</strong>
        </p>
      ) : null}
    </div>
  );
}
