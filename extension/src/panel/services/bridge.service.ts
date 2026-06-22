import { Injectable, OnActivated, OnDeactivation, inject } from "@wirestate/core";
import { type DevtoolsEvent, type DevtoolsRootSnapshot } from "@wirestate/core/devtools";
import { BoundAction, Observable, RefObservable, makeObservable } from "@wirestate/mobx";

import {
  PANEL_PORT_PREFIX,
  type BackendToPanelPayload,
  type InspectBindingFn,
  type InspectFn,
  type InspectNode,
  type PanelToBackendPayload,
} from "@/bridge/bridge.messages";
import { PanelTransport } from "@/panel/services/panel.transport";
import { type Optional } from "@/types/general";

/**
 * Connects the panel to the inspected tab's backend over the bridge and exposes the live, MobX-observable
 * state the panel renders. The DI replacement for the former `useBridge` hook: pulls structure + buffered
 * history on attach, streams deltas, reconnects when the MV3 worker sleeps, and resets on a full page
 * navigation. Chrome access is delegated to the injected {@link PanelTransport}; connect/teardown are
 * driven by the provider lifecycle (`@OnActivated`/`@OnDeactivation`).
 */
@Injectable()
export class BridgeService {
  private static readonly MAX_LOG: number = 512;
  private static readonly RECONNECT_DELAY_MS: number = 250;

  @Observable()
  public connected: boolean = false;

  @Observable()
  public protocolVersion: Optional<number> = undefined;

  @RefObservable()
  public roots: ReadonlyArray<DevtoolsRootSnapshot> = [];

  @RefObservable()
  public log: ReadonlyArray<DevtoolsEvent> = [];

  private port: Optional<chrome.runtime.Port>;
  private readonly pending: Map<number, (node: InspectNode) => void> = new Map();
  private requestId: number = 0;
  private reconnectTimer: Optional<ReturnType<typeof setTimeout>>;
  private disposed: boolean = false;

  public constructor(private readonly transport: PanelTransport = inject(PanelTransport)) {
    makeObservable(this);
  }

  @OnActivated()
  public onActivated(): void {
    this.connect();
    this.transport.onNavigated(() => this.reset());
  }

  @OnDeactivation()
  public onDeactivation(): void {
    this.disposed = true;

    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer);
    }

    this.port?.disconnect();
    this.port = undefined;
  }

  /**
   * Lazily reads one level of an instance's state at a path. Resolves over the bridge.
   *
   * @param rootId - Root whose live instance state is read.
   * @param instanceId - Instance to read from.
   * @param path - Object keys / array indices from the instance to the target value.
   * @returns The one-level node at `path`, or an `unsupported` marker when the bridge is down.
   */
  public readonly inspect: InspectFn = (rootId, instanceId, path) =>
    this.request((requestId) => ({ type: "inspect", requestId, rootId, instanceId, path }));

  /**
   * Lazily reads one level of a `Value` binding's value at a path. Resolves over the bridge.
   *
   * @param rootId - Root whose binding value is read.
   * @param bindingId - `Value` binding to read from.
   * @param path - Object keys / array indices from the binding's value to the target.
   * @returns The one-level node at `path`, or an `unsupported` marker when the bridge is down.
   */
  public readonly inspectBinding: InspectBindingFn = (rootId, bindingId, path) =>
    this.request((requestId) => ({ type: "inspectBinding", requestId, rootId, bindingId, path }));

  /**
   * Clears the streamed delta log (the Timeline's clear action).
   */
  @BoundAction()
  public clear(): void {
    this.log = [];
  }

  private connect(): void {
    const port: chrome.runtime.Port = this.transport.openPort(`${PANEL_PORT_PREFIX}${this.transport.tabId}`);

    this.port = port;
    this.setConnected(true);

    port.onMessage.addListener((message: BackendToPanelPayload): void => this.onMessage(port, message));

    port.onDisconnect.addListener((): void => {
      this.port = undefined;
      // Fail any in-flight inspect requests rather than leaving the panel spinning.
      for (const resolve of this.pending.values()) {
        resolve({ kind: "unsupported" });
      }

      this.pending.clear();

      if (!this.disposed) {
        this.reconnectTimer = setTimeout(() => this.connect(), BridgeService.RECONNECT_DELAY_MS);
      }
    });

    port.postMessage({ type: "attach" } satisfies PanelToBackendPayload);
  }

  private request(build: (requestId: number) => PanelToBackendPayload): Promise<InspectNode> {
    const port: Optional<chrome.runtime.Port> = this.port;

    if (!port) {
      return Promise.resolve({ kind: "unsupported" });
    }

    const requestId: number = (this.requestId += 1);

    return new Promise((resolve) => {
      this.pending.set(requestId, resolve);
      port.postMessage(build(requestId));
    });
  }

  @BoundAction()
  private setConnected(connected: boolean): void {
    this.connected = connected;
  }

  @BoundAction()
  private applyInit(
    protocolVersion: number,
    roots: ReadonlyArray<DevtoolsRootSnapshot>,
    log: ReadonlyArray<DevtoolsEvent>
  ): void {
    this.protocolVersion = protocolVersion;
    this.roots = roots;
    this.log = log;
  }

  @BoundAction()
  private applySnapshot(roots: ReadonlyArray<DevtoolsRootSnapshot>): void {
    this.roots = roots;
  }

  @BoundAction()
  private appendEvent(event: DevtoolsEvent): void {
    this.log = [...this.log, event].slice(-BridgeService.MAX_LOG);
  }

  @BoundAction()
  private reset(): void {
    this.roots = [];
    this.log = [];
  }

  private onMessage(port: chrome.runtime.Port, message: BackendToPanelPayload): void {
    switch (message.type) {
      case "init":
        this.applyInit(message.protocolVersion, message.roots, message.events.slice(-BridgeService.MAX_LOG));
        break;

      case "snapshot":
        this.applySnapshot(message.roots);
        break;

      case "event":
        this.appendEvent(message.event);
        // Structure-affecting deltas -> pull a fresh tree; message deltas don't change it.
        if (message.event.kind !== "message") {
          port.postMessage({ type: "refresh" } satisfies PanelToBackendPayload);
        }

        break;

      case "inspectResult":
        this.pending.get(message.requestId)?.(message.node);
        this.pending.delete(message.requestId);
        break;

      case "page-connected":
        // A fresh page backend just paired (reload/first load/worker wake); re-pull its snapshot.
        port.postMessage({ type: "attach" } satisfies PanelToBackendPayload);
        break;
    }
  }
}
