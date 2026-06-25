import { Injectable, inject, OnProvision, OnDeprovision, WireStatus } from "@wirestate/core";
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
import { type Nullable, type Optional } from "@/types/general";

/**
 * Connects the panel to the inspected tab's backend over the bridge and exposes the live, MobX-observable
 * state the panel renders.
 */
@Injectable()
export class BridgeService {
  private static readonly MAX_LOG: number = 512;
  private static readonly RECONNECT_DELAY_MS: number = 250;

  @Observable()
  public isConnected: boolean = false;

  @Observable()
  public protocolVersion: Optional<number> = undefined;

  @RefObservable()
  public roots: ReadonlyArray<DevtoolsRootSnapshot> = [];

  @RefObservable()
  public log: ReadonlyArray<DevtoolsEvent> = [];

  private port: Nullable<chrome.runtime.Port> = null;
  private reconnectTimer: Nullable<ReturnType<typeof setTimeout>> = null;
  private requestId: number = 0;
  private pending: Map<number, (node: InspectNode) => void> = new Map();

  public constructor(
    private readonly status: WireStatus = WireStatus.for(this, { initialize: true }),
    private readonly transport: PanelTransport = inject(PanelTransport)
  ) {
    makeObservable(this);
  }

  @OnProvision()
  public onProvision(): void {
    this.connect();
    this.transport.onNavigated(() => this.reset());
  }

  @OnDeprovision()
  public onDeprovision(): void {
    this.port?.disconnect();
    this.port = null;

    // The disconnect above can synchronously schedule a reconnect, so cancel the timer
    // afterwards (not before) to leave teardown with nothing pending. `connect()` also
    // bails on a stale timer as a backstop.
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Lazily reads one level of an instance's state at a path. Resolves over the bridge.
   *
   * @param rootId - Root whose live instance state is read.
   * @param instanceId - Instance to read from.
   * @param path - Object keys / array indices from the instance to the target value.
   * @returns The one-level node at `path`, or an `unsupported` marker when the bridge is down.
   */
  @RefObservable()
  public inspect: InspectFn = this.createInspect();

  /**
   * Lazily reads one level of a `Value` binding's value at a path. Resolves over the bridge.
   *
   * @param rootId - Root whose binding value is read.
   * @param bindingId - `Value` binding to read from.
   * @param path - Object keys / array indices from the binding's value to the target.
   * @returns The one-level node at `path`, or an `unsupported` marker when the bridge is down.
   */
  @RefObservable()
  public inspectBinding: InspectBindingFn = this.createInspectBinding();

  /**
   * Clears the streamed delta log (the Timeline's clear action).
   */
  @BoundAction()
  public clear(): void {
    this.log = [];
  }

  /**
   * Pulls the latest state from the inspected app on demand.
   * The panel has no direct reactivity to the app's field values, so this is the manual "fetch latest".
   */
  @BoundAction()
  public refresh(): void {
    this.port?.postMessage({ type: "refresh" } satisfies PanelToBackendPayload);
    this.inspect = this.createInspect();
    this.inspectBinding = this.createInspectBinding();
  }

  private connect(): void {
    if (this.status.isInactive) {
      return;
    }

    const port: chrome.runtime.Port = this.transport.openPort(`${PANEL_PORT_PREFIX}${this.transport.tabId}`);

    this.port = port;
    this.setConnected(true);

    port.onMessage.addListener((message: BackendToPanelPayload): void => this.onMessage(port, message));

    port.onDisconnect.addListener((): void => {
      this.port = null;

      for (const resolve of this.pending.values()) {
        resolve({ kind: "unsupported" });
      }

      this.pending.clear();

      if (this.status.isInactive) {
        return;
      }

      this.reconnectTimer = setTimeout(() => this.connect(), BridgeService.RECONNECT_DELAY_MS);
    });

    port.postMessage({ type: "attach" } satisfies PanelToBackendPayload);
  }

  private request(build: (requestId: number) => PanelToBackendPayload): Promise<InspectNode> {
    const port: Nullable<chrome.runtime.Port> = this.port;

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
    this.isConnected = connected;
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

  /**
   * @returns A closure that resolves one level of instance state over the bridge.
   */
  private createInspect(): InspectFn {
    return (rootId, instanceId, path) =>
      this.request((requestId) => ({ type: "inspect", requestId, rootId, instanceId, path }));
  }

  /**
   * @returns A closure that resolves one level of a `Value` binding's value over the bridge.
   */
  private createInspectBinding(): InspectBindingFn {
    return (rootId, bindingId, path) =>
      this.request((requestId) => ({ type: "inspectBinding", requestId, rootId, bindingId, path }));
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
