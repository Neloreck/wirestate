import "./GeneralControls.css";

import { CommandBus, EventBus } from "@wirestate/core";
import { useInjection } from "@wirestate/react";
import { useCallback } from "react";

import { EGlobalCommand } from "@/constants/commands";
import { EGlobalEvent } from "@/constants/events";
import { CounterService } from "@/services/CounterService";
import { ThemeService } from "@/services/ThemeService";

export function GeneralControls() {
  const commandBus: CommandBus = useInjection(CommandBus);
  const eventBus: EventBus = useInjection(EventBus);
  const counterService: CounterService = useInjection(CounterService);
  const themeService: ThemeService = useInjection(ThemeService);

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
        <button className={"counter"} onClick={() => counterService.increment()}>
          Increment — count: {counterService.count.value} ({counterService.isEven.value ? "even" : "odd"})
        </button>
        <button className={"counter ghost"} onClick={() => counterService.reset()}>
          Reset counter
        </button>

        <button className={"counter ghost"} onClick={() => themeService.toggle()}>
          Toggle theme ({themeService.theme.value})
        </button>

        <button className={"counter ghost"} onClick={onUserPinged}>
          Ping (emit event)
        </button>

        <button className={"counter ghost"} onClick={onDumpData}>
          Dump services (run command)
        </button>
      </div>
    </div>
  );
}
