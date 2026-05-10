import { watch } from "@lit-labs/signals";
import { CommandDescriptor, WireScope, Event } from "@wirestate/core";
import { injection, onEvent } from "@wirestate/lit";
import { Computed, computed } from "@wirestate/lit-signals";
import { css, CSSResult, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import { EGlobalCommand } from "@/constants/commands";
import { EGlobalEvent } from "@/constants/events";
import { CounterService } from "@/services/CounterService";
import { LoggerService } from "@/services/LoggerService";
import { ThemeService } from "@/services/ThemeService";
import { resetStyles } from "@/styles/reset";

@customElement("w-general-controls")
export class GeneralControls extends LitElement {
  public static styles: Array<CSSResult> = [
    resetStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
        padding: var(--space-2);
        gap: var(--space-2);

        .heading {
          display: flex;
          flex-direction: column;
          justify-content: center;

          h2 {
            color: var(--accent);
          }
        }

        .controls-row {
          display: flex;
          gap: var(--space-2);
        }

        .control {
          font-size: 16px;
          padding: 5px 10px;
          border-radius: 5px;
          color: var(--accent);
          background: var(--accent-bg);
          border: 2px solid transparent;
          transition:
            border-color 0.3s,
            background 0.3s;
          cursor: pointer;

          &:hover {
            border-color: var(--accent-border);
          }

          &:focus-visible {
            outline: 2px solid var(--accent);
            outline-offset: 2px;
          }

          &.ghost {
            color: var(--text-h);
            background: var(--social-bg);
          }
        }
      }
    `,
  ];

  @injection(WireScope)
  private readonly scope!: WireScope;

  @injection(CounterService)
  private readonly counterService!: CounterService;

  @injection(ThemeService)
  private readonly themeService!: ThemeService;

  @injection(LoggerService)
  private readonly loggerService!: LoggerService;

  private isOddLabel: Computed<string> = computed(() => (this.counterService.count.get() % 2 === 0 ? "even" : "odd"));

  @onEvent()
  public onAnyEvent(event: Event): void {
    console.info("[general-controls] Log all events:", event.type, event.payload, event.from);
  }

  @onEvent(EGlobalEvent.COUNTER_RESET)
  public onSingleResetEvent(event: Event): void {
    console.info("[general-controls] Counter was reset (specific event):", event.type);
  }

  @onEvent([EGlobalEvent.COUNTER_RESET, "NOT_EXISTING_EVENT_TYPE"])
  public onMultipleResetEvent(event: Event): void {
    console.info("[general-controls] Counter was reset (array of events):", event.type);
  }

  public onDumpData(): void {
    const command: CommandDescriptor = this.scope.executeCommand(EGlobalCommand.DUMP_DATA, {
      at: Date.now(),
    });

    // [*] Pass check - command registered and scheduled as async while descriptor creation is sync.
    console.info("[general-controls] Dump data task scheduled:", {
      status: command.status,
    });

    // [*] Pass check - command descriptor returns async task to get result.
    command.task.then((result: unknown) => {
      console.info("[general-controls] Dump data result:", {
        result,
        status: command.status,
      });
    });
  }

  public render() {
    return html`
      <div class="heading">
        <h2>Wirestate Playground</h2>
        <p>lit signals + inversify container + custom events/queries/commands</p>
      </div>

      <div class="controls-row">
        <button class="control" @click="${() => this.counterService.increment()}">
          count: ${watch(this.counterService.count)} (${watch(this.isOddLabel)})
        </button>

        <button class="control ghost" @click="${() => this.scope.emitEvent(EGlobalEvent.COUNTER_INCREMENT, 3)}">
          increment+3 (signal)
        </button>

        <button class="control ghost" @click="${() => this.counterService.reset()}">reset</button>

        <button class="control ghost" @click="${() => this.themeService.toggleTheme()}">
          theme ${watch(this.themeService.theme)}
        </button>

        <button class="control ghost" @click="${() => this.onDumpData()}">Dump data (command)</button>

        <button class="control ghost" @click="${() => this.loggerService.clear()}">Clear log</button>
      </div>
    `;
  }
}
