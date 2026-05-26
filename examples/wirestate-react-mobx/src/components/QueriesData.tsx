import "./QueriesData.css";

import {
  type AsyncQueryExecutor,
  type QueryExecutor,
  useAsyncQueryExecutor,
  useInjection,
  useOptionalInjection,
  useQueryExecutor,
  useQueryHandler,
} from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";
import { useCallback, useState } from "react";

import { EGlobalQuery } from "@/constants/queries";
import {
  ECounterServiceQuery,
  type ICounterSnapshot,
  type ICounterSummary,
} from "@/services/CounterService.query";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";
import type { Optional, Theme } from "@/types";

export const QueriesData = observer(() => {
  const [snapshot, setSnapshot] = useState<Optional<ICounterSnapshot>>(null);
  const [summary, setSummary] = useState<Optional<ICounterSummary>>(null);

  const themeService: ThemeService = useInjection(ThemeService);
  const loggerService: Optional<LoggerService> =
    useOptionalInjection(LoggerService);

  const queryData: QueryExecutor = useQueryExecutor();
  const queryAsyncData: AsyncQueryExecutor = useAsyncQueryExecutor();

  const onPullSummary = useCallback(() => {
    const value: ICounterSummary = queryData<ICounterSummary>(
      ECounterServiceQuery.GET_COUNTER_SUMMARY,
      { value: "some-data" },
    );

    setSummary(value);
  }, [queryData]);

  const onFetchSnapshot = useCallback(async () => {
    const value: ICounterSnapshot = await queryAsyncData<ICounterSnapshot>(
      ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT,
    );

    setSnapshot(value);

    if (loggerService) {
      loggerService.log(`[QueriesData] Fetched snapshot:`, value);
    }
  }, [queryAsyncData, loggerService]);

  useQueryHandler<Theme>(
    EGlobalQuery.GET_ACTIVE_THEME,
    () => themeService.theme,
  );

  return (
    <section>
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
          Summary — count: <strong>{summary.count}</strong>, parity:{" "}
          <strong>{summary.isEven ? "even" : "odd"}</strong>
        </p>
      ) : null}

      {snapshot ? (
        <p className={"query-result"}>
          Snapshot — count: <strong>{snapshot.count}</strong>, fetched at:{" "}
          <strong>{new Date(snapshot.fetchedAt).toLocaleTimeString()}</strong>
        </p>
      ) : null}

      <br />
    </section>
  );
});
