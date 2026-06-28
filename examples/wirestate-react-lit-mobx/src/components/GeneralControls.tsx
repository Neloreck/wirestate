import "./GeneralControls.css";

import { CommandBus, EventBus } from "@wirestate/core";
import { useInjection } from "@wirestate/react";
import { useCallback } from "react";

import { EGlobalCommand } from "@/constants/commands";
import { EGlobalEvent } from "@/constants/events";
import { CounterService } from "@/services/CounterService";
import { ThemeService } from "@/services/ThemeService";

export function GeneralControls() {
  const { count, isEven, increment, reset } = useInjection(CounterService);
  const { theme, toggle } = useInjection(ThemeService);

  const commandBus: CommandBus = useInjection(CommandBus);
  const eventBus: EventBus = useInjection(EventBus);

  const onDumpData = useCallback(() => {
    const result = commandBus.execute(EGlobalCommand.DUMP_DATA, {
      at: Date.now(),
    });

    console.info("[GeneralControls] Dump data result:", result);
  }, [commandBus]);

  const onUserPinged = useCallback(() => {
    eventBus.emit(EGlobalEvent.USER_PINGED, { at: Date.now() });
  }, [eventBus]);

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
