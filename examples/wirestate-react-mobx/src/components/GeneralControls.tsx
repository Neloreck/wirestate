import "./GeneralControls.css";

import {
  type CommandCaller,
  type EventEmitter,
  useCommandCaller,
  useInjection,
  useEventEmitter,
} from "@wirestate/react";
import { observer } from "@wirestate/react-mobx";
import { useCallback } from "react";

import { EGlobalCommand } from "@/constants/commands";
import { EGlobalEvent } from "@/constants/events";
import { CounterService } from "@/services/CounterService";
import { ThemeService } from "@/services/ThemeService";

export const GeneralControls = observer(() => {
  const counterService: CounterService = useInjection(CounterService);
  const themeService: ThemeService = useInjection(ThemeService);

  const executeCommand: CommandCaller = useCommandCaller();
  const emitEvent: EventEmitter = useEventEmitter();

  const onDumpData = useCallback(() => {
    const command = executeCommand(EGlobalCommand.DUMP_DATA, {
      at: Date.now(),
    });

    console.info("[GeneralControls] Dump data task scheduled:", {
      status: command.status,
    });

    command.task.then((result: unknown) => {
      console.info("[GeneralControls] Dump data result:", {
        result,
        status: command.status,
      });
    });
  }, [executeCommand]);

  const onUserPinged = useCallback(() => {
    emitEvent(EGlobalEvent.USER_PINGED, { at: Date.now() });
  }, [emitEvent]);

  return (
    <div className={"general-controls"}>
      <div>
        <h2>Wirestate Playground</h2>
        <p>
          mobx observables + inversify container + custom
          events/queries/commands
        </p>
      </div>

      <div className={"counter-row"}>
        <button
          className={"counter"}
          onClick={() => counterService.increment()}
        >
          Count is {counterService.count} (
          {counterService.isEven ? "even" : "odd"})
        </button>
        <button
          className={"counter ghost"}
          onClick={() => counterService.reset()}
        >
          Reset
        </button>

        <button
          className={"counter ghost"}
          onClick={() => themeService.toggle()}
        >
          Theme: {themeService.theme}
        </button>

        <button className={"counter ghost"} onClick={() => onUserPinged()}>
          Ping (event)
        </button>

        <button className={"counter ghost"} onClick={() => onDumpData()}>
          Dump services (command)
        </button>
      </div>
    </div>
  );
});
