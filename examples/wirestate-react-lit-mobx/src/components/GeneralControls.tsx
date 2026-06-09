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
  const counterService: CounterService = useInjection(CounterService);
  const themeService: ThemeService = useInjection(ThemeService);

  const executeCommand: CommandExecutor = useCommandExecutor();
  const emitEvent: EventEmitter = useEventEmitter();

  const onDumpData = useCallback(() => {
    const result = executeCommand(EGlobalCommand.DUMP_DATA, {
      at: Date.now(),
    });

    console.info("[GeneralControls] Dump data result:", result);
  }, [executeCommand]);

  const onUserPinged = useCallback(() => {
    emitEvent(EGlobalEvent.USER_PINGED, { at: Date.now() });
  }, [emitEvent]);

  return (
    <div className={"general-controls"}>
      <div className={"counter-row"}>
        <button
          className={"counter"}
          onClick={() => counterService.increment()}
        >
          Increment — count: {counterService.count} (
          {counterService.isEven ? "even" : "odd"})
        </button>
        <button
          className={"counter ghost"}
          onClick={() => counterService.reset()}
        >
          Reset counter
        </button>

        <button
          className={"counter ghost"}
          onClick={() => themeService.toggle()}
        >
          Toggle theme ({themeService.theme})
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
