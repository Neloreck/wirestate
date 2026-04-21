import "./QueriesData.css";

import { useCallback, useState } from "react";

import type { Optional, Theme } from "@/application/types";
import { EGlobalQuery } from "@/core/queries";
import {
  ECounterServiceQuery,
  type ICounterSnapshot,
  type ICounterSummary,
} from "@/core/services/counter";
import { LoggerService } from "@/core/services/logging";
import { ThemeService } from "@/core/services/theme";
import {
  observer,
  useInjection,
  useOptionalInjection,
  useQueryCaller,
  useQueryHandler,
  useSyncQueryCaller,
} from "@/libs/wirestate";

export const QueriesData = observer(() => {
  const [snapshot, setSnapshot] = useState<Optional<ICounterSnapshot>>(null);
  const [summary, setSummary] = useState<Optional<ICounterSummary>>(null);

  const themeService: ThemeService = useInjection(ThemeService);
  // [*] Pass ability to use optional injections.
  const loggerService: Optional<LoggerService> =
    useOptionalInjection(LoggerService);

  // [*] Pass ability to dispatch queries from UI and get sync/async data.
  const queryData = useQueryCaller();
  const querySyncData = useSyncQueryCaller();

  // [*] Pass ability to declare handler to get sync data.
  const onPullSummary = useCallback(() => {
    const value: ICounterSummary = querySyncData<ICounterSummary>(
      ECounterServiceQuery.GET_COUNTER_SUMMARY,
      { value: "some-data" },
    );

    setSummary(value);
  }, [querySyncData]);

  // [*] Pass ability to declare handler to get async data.
  const onFetchSnapshot = useCallback(async () => {
    const value: ICounterSnapshot = await queryData<ICounterSnapshot>(
      ECounterServiceQuery.FETCH_COUNTER_SNAPSHOT,
    );

    setSnapshot(value);

    if (loggerService) {
      loggerService.log(`[QueriesData] Fetched snapshot:`, value);
    }
  }, [queryData, loggerService]);

  // [*] Pass ability to declare a query handler from the React tree.
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
