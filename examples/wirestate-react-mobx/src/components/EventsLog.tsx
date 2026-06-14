import "./EventsLog.css";

import { useInjection } from "@wirestate/react";

import { LoggerService } from "@/services/LoggerService";

export function EventsLog() {
  const { logs, clear } = useInjection(LoggerService);

  return (
    <div id={"logs"}>
      <div className={"event-log"}>
        {logs.length === 0 ? (
          <div className={"event-log__empty"}>No events yet — try the buttons above.</div>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className={"event-log__entry"}>
              <span className={"event-log__type"}>{JSON.stringify(entry.type)}</span>
              <span className={"event-log__payload"}>
                {entry.payload !== undefined ? JSON.stringify(entry.payload) : "—"}
              </span>
            </div>
          ))
        )}
      </div>

      <button className={"counter ghost"} onClick={clear}>
        Clear events
      </button>
    </div>
  );
}
