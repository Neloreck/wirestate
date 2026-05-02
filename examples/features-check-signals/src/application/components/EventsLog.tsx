import "./EventsLog.css";

import { LoggerService } from "@/core/services/logging";
import { useInjection } from "@/libs/wirestate";

export function EventsLog() {
  const loggerService: LoggerService = useInjection(LoggerService);

  return (
    <div id={"logs"}>
      <h2>Events log</h2>
      <div className={"event-log"}>
        {loggerService.logs.value.length === 0 ? (
          <div className={"event-log__empty"}>
            No events yet — try the buttons above.
          </div>
        ) : (
          loggerService.logs.value.map((entry) => (
            <div key={entry.id} className={"event-log__entry"}>
              <span className={"event-log__type"}>
                {JSON.stringify(entry.type)}
              </span>
              <span className={"event-log__payload"}>
                {entry.payload !== undefined
                  ? JSON.stringify(entry.payload)
                  : "—"}
              </span>
            </div>
          ))
        )}
      </div>

      <button className={"counter ghost"} onClick={() => loggerService.clear()}>
        Clear log
      </button>
    </div>
  );
}
