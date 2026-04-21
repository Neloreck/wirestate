import "./SignalsLog.css";

import { LoggerService } from "@/core/services/logging";
import { observer, useInjection } from "@/libs/wirestate";

export const SignalsLog = observer(() => {
  const loggerService: LoggerService = useInjection(LoggerService);

  return (
    <div id={"logs"}>
      <h2>Signal log</h2>
      <div className={"signal-log"}>
        {loggerService.logs.length === 0 ? (
          <div className={"signal-log__empty"}>
            No signals yet — try the buttons above.
          </div>
        ) : (
          loggerService.logs.map((entry) => (
            <div key={entry.id} className={"signal-log__entry"}>
              <span className={"signal-log__type"}>
                {JSON.stringify(entry.type)}
              </span>
              <span className={"signal-log__payload"}>
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
});
