import "./GeneralControls.css";

import { useCallback } from "react";

import { EGlobalCommand } from "@/core/commands";
import { CounterService } from "@/core/services/counter";
import { ThemeService } from "@/core/services/theme";
import { EGlobalSignal } from "@/core/signals";
import {
  observer,
  type CommandCaller,
  type SignalEmitter,
  useCommandCaller,
  useInjection,
  useSignalEmitter,
} from "@/libs/wirestate";

export const GeneralControls = observer(() => {
  const counterService: CounterService = useInjection(CounterService);
  const themeService: ThemeService = useInjection(ThemeService);

  const executeCommand: CommandCaller = useCommandCaller();
  const emitSignal: SignalEmitter = useSignalEmitter();

  // [*] Pass ability to call commands from UI.
  const onDumpData = useCallback(() => {
    const command = executeCommand(EGlobalCommand.DUMP_DATA, {
      at: Date.now(),
    });

    // [*] Pass check - command registered and scheduled as async while descriptor creation is sync.
    console.info("[GeneralControls] Dump data task scheduled:", {
      status: command.status,
    });

    // [*] Pass check - command descriptor returns async task to get result.
    command.task.then((result: unknown) => {
      console.info("[GeneralControls] Dump data result:", {
        result,
        status: command.status,
      });
    });
  }, [executeCommand]);

  // [*] Pass ability to emit signals from UI.
  const onUserPinged = useCallback(() => {
    emitSignal(EGlobalSignal.USER_PINGED, { at: Date.now() });
  }, [emitSignal]);

  return (
    <div className={"general-controls"}>
      <div>
        <h2>Wirestate Playground</h2>
        <p>mobx observables + inversify container + custom signals/queries</p>
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
          Ping (signal)
        </button>

        <button className={"counter ghost"} onClick={() => onDumpData()}>
          Dump services
        </button>
      </div>
    </div>
  );
});
