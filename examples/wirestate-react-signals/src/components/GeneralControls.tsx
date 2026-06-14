import "./GeneralControls.css";

import {
  type EventEmitter,
  useInjection,
  useEventEmitter,
  useCommandExecutor,
  type CommandExecutor,
} from "@wirestate/react";
import { useCallback } from "react";

import { EGlobalCommand } from "@/constants/commands";
import { EGlobalEvent } from "@/constants/events";
import { CounterService } from "@/services/CounterService";
import { ThemeService } from "@/services/ThemeService";

export function GeneralControls() {
  const counterService: CounterService = useInjection(CounterService);
  const themeService: ThemeService = useInjection(ThemeService);

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
        <button className={"counter"} onClick={() => counterService.increment()}>
          Increment — count: {counterService.count.value} ({counterService.isEven.value ? "even" : "odd"})
        </button>
        <button className={"counter ghost"} onClick={() => counterService.reset()}>
          Reset counter
        </button>

        <button className={"counter ghost"} onClick={() => themeService.toggle()}>
          Toggle theme ({themeService.theme.value})
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
