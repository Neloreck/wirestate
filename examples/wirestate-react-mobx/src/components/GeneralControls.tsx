import "./GeneralControls.css";

import {
  type CommandExecutor,
  type EventEmitter,
  useCommandExecutor,
  useEventEmitter,
  useInjection,
} from "@wirestate/react";
import { useCallback } from "react";

import { EGlobalCommand } from "@/constants/commands";
import { EGlobalEvent } from "@/constants/events";
import { CounterService } from "@/services/CounterService";
import { ThemeService } from "@/services/ThemeService";

export function GeneralControls() {
  const { count, isEven, increment, reset } = useInjection(CounterService);
  const { theme, toggle } = useInjection(ThemeService);

  const execute: CommandExecutor = useCommandExecutor();
  const emit: EventEmitter = useEventEmitter();

  const onDumpData = useCallback(() => {
    const result = execute(EGlobalCommand.DUMP_DATA, {
      at: Date.now(),
    });

    console.info("[GeneralControls] Dump data result:", result);
  }, [execute]);

  const onUserPinged = useCallback(() => {
    emit(EGlobalEvent.USER_PINGED, { at: Date.now() });
  }, [emit]);

  return (
    <div className={"general-controls"}>
      <div className={"counter-row"}>
        <button className={"counter"} onClick={increment}>
          Increment — count: {count} ({isEven ? "even" : "odd"})
        </button>
        <button className={"counter ghost"} onClick={reset}>
          Reset counter
        </button>

        <button className={"counter ghost"} onClick={toggle}>
          Toggle theme ({theme})
        </button>

        <button className={"counter ghost"} onClick={() => onUserPinged()}>
          Ping (emit event)
        </button>

        <button className={"counter ghost"} onClick={() => onDumpData()}>
          Dump services (run command)
        </button>
      </div>
    </div>
  );
}
