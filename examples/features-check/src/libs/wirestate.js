"use no memo";
import { LazyServiceIdentifier, Container } from "inversify";
export {
  Container,
  inject as Inject,
  injectable as Injectable,
} from "inversify";
import { observable, action, computed } from "mobx";
export {
  autorun,
  flow,
  flowResult,
  isFlow,
  isFlowCancellationError,
  makeAutoObservable,
  makeObservable,
  runInAction,
} from "mobx";
export { observer } from "mobx-react-lite";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  createElement,
  useCallback,
  useRef,
} from "react";
function Observable() {
  return observable;
}
function ShallowObservable() {
  return observable.shallow;
}
function RefObservable() {
  return observable.ref;
}
function DeepObservable() {
  return observable.deep;
}
function Action() {
  return action;
}
function Computed() {
  return computed;
}
function forwardRef(forward) {
  return new LazyServiceIdentifier(forward);
}
const SIGNAL_BUS_TOKEN = Symbol.for("@wirestate/signal-bus");
const QUERY_BUS_TOKEN = Symbol.for("@wirestate/query-bus");
const INITIAL_STATE_TOKEN = Symbol.for("@wirestate/initial-state");
const INITIAL_STATE_SHARED_TOKEN = Symbol.for(
  "@wirestate/initial-state/shared",
);
const QUERY_HANDLER_METADATA = new WeakMap();
const SIGNAL_HANDLER_METADATA = new WeakMap();
const CONTAINER_REFS_BY_SERVICE = new WeakMap();
const SIGNAL_UNSUBSCRIBERS_BY_SERVICE = new WeakMap();
const QUERY_UNREGISTERS_BY_SERVICE = new WeakMap();
function getQueryHandlerMetadata(instance) {
  const chain = [];
  let ctor = instance.constructor;
  while (
    typeof ctor === "function" &&
    ctor !== Object &&
    ctor !== Function.prototype
  ) {
    const own = QUERY_HANDLER_METADATA.get(ctor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    ctor = Object.getPrototypeOf(ctor);
  }
  return chain.reverse().flat();
}
function getSignalHandlerMetadata(instance) {
  const chain = [];
  let ctor = instance.constructor;
  while (
    typeof ctor === "function" &&
    ctor !== Object &&
    ctor !== Function.prototype
  ) {
    const own = SIGNAL_HANDLER_METADATA.get(ctor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    ctor = Object.getPrototypeOf(ctor);
  }
  return chain.reverse().flat();
}
function buildSignalDispatcher(instance) {
  const entries = [];
  if (typeof instance.onSignal === "function") {
    entries.push({
      types: null,
      handler: (signal) => instance.onSignal?.(signal),
    });
  }
  for (const meta of getSignalHandlerMetadata(instance)) {
    const method = instance[meta.methodName];
    if (typeof method !== "function") {
      continue;
    }
    entries.push({
      types: meta.types,
      handler: method.bind(instance),
    });
  }
  if (entries.length === 0) {
    return null;
  }
  return (signal) => {
    for (const entry of entries) {
      if (entry.types === null || entry.types.includes(signal.type)) {
        entry.handler(signal);
      }
    }
  };
}
function bindService(container, token, ServiceClass, isOnceBind) {
  if (isOnceBind && container.isBound(token)) {
    return;
  }
  container.bind(token).to(ServiceClass).inSingletonScope();
  container.onActivation(token, (_ctx, instance) => {
    CONTAINER_REFS_BY_SERVICE.set(instance, container);
    const dispatcher = buildSignalDispatcher(instance);
    if (dispatcher) {
      _attachSignalSub(instance, dispatcher);
    }
    const queryBus = container.get(QUERY_BUS_TOKEN);
    for (const meta of getQueryHandlerMetadata(instance)) {
      const method = instance[meta.methodName];
      if (typeof method !== "function") {
        continue;
      }
      const unregister = queryBus.register(meta.type, method.bind(instance));
      _attachQueryUnreg(instance, unregister);
    }
    const result = instance.onActivated();
    if (result && typeof result.then === "function") {
      result.catch((error) => {
        console.error(
          "[ioc] onActivated rejected for:",
          ServiceClass.name,
          error,
        );
      });
    }
    return instance;
  });
  container.onDeactivation(token, (instance) => {
    instance.IS_DISPOSED = true;
    _detachQueryUnregs(instance);
    _detachSignalSub(instance);
    CONTAINER_REFS_BY_SERVICE.delete(instance);
    return instance.onDeactivated();
  });
}
function _attachSignalSub(service, handler) {
  const bus = CONTAINER_REFS_BY_SERVICE.get(service)?.get(SIGNAL_BUS_TOKEN);
  if (!bus) {
    return;
  }
  const unsub = bus.subscribe(handler);
  SIGNAL_UNSUBSCRIBERS_BY_SERVICE.set(service, unsub);
}
function _detachSignalSub(service) {
  const unsub = SIGNAL_UNSUBSCRIBERS_BY_SERVICE.get(service);
  if (unsub) {
    unsub();
    SIGNAL_UNSUBSCRIBERS_BY_SERVICE.delete(service);
  }
}
function _attachQueryUnreg(service, unregister) {
  let list = QUERY_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    list = [];
    QUERY_UNREGISTERS_BY_SERVICE.set(service, list);
  }
  list.push(unregister);
}
function _detachQueryUnregs(service) {
  const list = QUERY_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    return;
  }
  for (const unreg of list) {
    try {
      unreg();
    } catch (error) {
      console.error("[ioc] query unregister threw:", error);
    }
  }
  QUERY_UNREGISTERS_BY_SERVICE.delete(service);
}
class InitialState {
  constructor(shared = {}, bound = []) {
    this.sharedState = shared;
    this.boundStates = new Map();
    for (const [ServiceClass, state] of bound) {
      this.boundStates.set(ServiceClass, state);
    }
  }
  getShared() {
    return this.sharedState;
  }
  getFor(ServiceClass) {
    return this.boundStates.get(ServiceClass) || null;
  }
  hasFor(ServiceClass) {
    return this.boundStates.has(ServiceClass);
  }
}
class QueryBus {
  handlers = new Map();
  register(type, handler) {
    let stack = this.handlers.get(type);
    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }
    stack.push(handler);
    return () => {
      const current = this.handlers.get(type);
      if (!current) {
        return;
      }
      const idx = current.indexOf(handler);
      if (idx >= 0) {
        current.splice(idx, 1);
      }
      if (current.length === 0) {
        this.handlers.delete(type);
      }
    };
  }
  query(type, data) {
    const stack = this.handlers.get(type);
    if (!stack || stack.length === 0) {
      throw new Error(
        `[ioc] no query handler registered for type: ${String(type)}`,
      );
    }
    const top = stack[stack.length - 1];
    return top(data);
  }
  has(type) {
    const stack = this.handlers.get(type);
    return stack !== undefined && stack.length > 0;
  }
  clear() {
    this.handlers.clear();
  }
}
class SignalBus {
  handlers = new Set();
  emit(signal) {
    const snapshot = Array.from(this.handlers);
    for (const handler of snapshot) {
      try {
        handler(signal);
      } catch (error) {
        console.error("[ioc] Signal handler threw:", error);
      }
    }
  }
  subscribe(handler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
  clear() {
    this.handlers.clear();
  }
}
function createIocContainer(options = {}) {
  const container = new Container({
    defaultScope: "Singleton",
    parent: options.parent,
  });
  const initialState = new InitialState();
  container.bind(SIGNAL_BUS_TOKEN).toConstantValue(new SignalBus());
  container.bind(QUERY_BUS_TOKEN).toConstantValue(new QueryBus());
  container.bind(INITIAL_STATE_TOKEN).toConstantValue(new InitialState());
  container
    .bind(INITIAL_STATE_SHARED_TOKEN)
    .toConstantValue(initialState.getShared());
  return container;
}
function emitSignal(container, signal) {
  container.get(SIGNAL_BUS_TOKEN).emit(signal);
}
function query(container, type, data) {
  return container.get(QUERY_BUS_TOKEN).query(type, data);
}
function applyInitialState(container, shared = {}, bound = []) {
  const next = new InitialState(shared, bound);
  if (container.isBound(INITIAL_STATE_TOKEN)) {
    container.rebind(INITIAL_STATE_TOKEN).toConstantValue(next);
    container
      .rebind(INITIAL_STATE_SHARED_TOKEN)
      .toConstantValue(next.getShared());
  } else {
    container.bind(INITIAL_STATE_TOKEN).toConstantValue(next);
    container
      .bind(INITIAL_STATE_SHARED_TOKEN)
      .toConstantValue(next.getShared());
  }
}
const IocContext = createContext(null);
IocContext.displayName = "IocContext";
function createServicesProvider(services, options = {}) {
  const { activate } = options;
  if (activate && activate.length > 0) {
    for (const eager of activate) {
      if (!services.includes(eager)) {
        throw new Error(
          `[ioc] createServicesProvider: '${eager.name}' is listed in 'activate' but was not provided in 'services'.`,
        );
      }
    }
  }
  function ServicesProviderComponent(props) {
    const iocContext = useContext(IocContext);
    if (!iocContext) {
      throw new Error(
        "[ioc] <ServicesProvider> must be rendered inside an <IocProvider>.",
      );
    }
    const [initialPropsSnapshot] = useState(() => props);
    useMemo(() => {
      applyInitialState(
        iocContext.container,
        initialPropsSnapshot.initialState,
        initialPropsSnapshot.initialStates,
      );
      for (const ServiceClass of services) {
        bindService(iocContext.container, ServiceClass, ServiceClass, true);
      }
      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
    }, services);
    useEffect(() => {
      let didRebind = false;
      applyInitialState(
        iocContext.container,
        initialPropsSnapshot.initialState,
        initialPropsSnapshot.initialStates,
      );
      for (const ServiceClass of services) {
        if (!iocContext.container.isBound(ServiceClass)) {
          didRebind = true;
        }
        bindService(iocContext.container, ServiceClass, ServiceClass, true);
      }
      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
      if (didRebind) {
        iocContext.setRevision((r) => r + 1);
      }
      return () => {
        for (const service of services) {
          if (iocContext.container.isBound(service)) {
            iocContext.container.unbind(service);
          }
        }
        applyInitialState(iocContext.container, {}, []);
      };
    }, services);
    return props.children;
  }
  ServicesProviderComponent.displayName = "ServicesProvider";
  return ServicesProviderComponent;
}
const IocProvider = ({ container: externalContainer, children }) => {
  const [revision, setRevision] = useState(0);
  const [ownedContainer] = useState(() =>
    externalContainer ? null : createIocContainer(),
  );
  const container = externalContainer ?? ownedContainer;
  if (!container) {
    throw new Error(
      "[ioc] IocProvider failed to resolve a container instance.",
    );
  }
  const value = useMemo(
    () => ({
      container,
      revision,
      setRevision,
    }),
    [container, revision],
  );
  return createElement(
    IocContext.Provider,
    {
      value,
    },
    children,
  );
};
function useIocContext() {
  const value = useContext(IocContext);
  if (!value) {
    throw new Error(
      "[ioc] useContainer() must be called inside an <IocProvider>.",
    );
  }
  return value;
}
function useContainer() {
  return useIocContext().container;
}
function useContainerRevision() {
  return useIocContext().revision;
}
function OnQuery(type) {
  return (target, propertyKey) => {
    const ctor = target.constructor;
    let list = QUERY_HANDLER_METADATA.get(ctor);
    if (!list) {
      list = [];
      QUERY_HANDLER_METADATA.set(ctor, list);
    }
    list.push({
      methodName: propertyKey,
      type,
    });
  };
}
function useQueryCaller() {
  const container = useContainer();
  return useCallback(
    (type, data) => container.get(QUERY_BUS_TOKEN).query(type, data),
    [container],
  );
}
function useQueryHandler(type, handler) {
  const container = useContainer();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    const bus = container.get(QUERY_BUS_TOKEN);
    return bus.register(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
function useSyncQueryCaller() {
  const container = useContainer();
  return useCallback(
    (type, data) => container.get(QUERY_BUS_TOKEN).query(type, data),
    [container],
  );
}
class AbstractService {
  IS_DISPOSED = false;
  getContainer() {
    const ref = CONTAINER_REFS_BY_SERVICE.get(this);
    if (!ref) {
      throw new Error(
        "[ioc] BaseService.container accessed before activation. " +
          "Ensure service is bound via bindService() and resolved by the container.",
      );
    }
    return ref;
  }
  getService(serviceId) {
    return this.getContainer().get(serviceId);
  }
  emitSignal(signal) {
    this.getContainer().get(SIGNAL_BUS_TOKEN).emit(signal);
  }
  queryData(type, data) {
    return this.getContainer().get(QUERY_BUS_TOKEN).query(type, data);
  }
  getInitialState(ServiceClass) {
    const initialState = this.getContainer().get(INITIAL_STATE_TOKEN);
    return (
      (ServiceClass
        ? initialState.getFor(ServiceClass)
        : initialState.getShared()) || null
    );
  }
  onActivated() {}
  onDeactivated() {}
}
function useService(token) {
  const { container, revision } = useIocContext();
  return useMemo(() => container.get(token), [container, revision, token]);
}
function OnSignal(types) {
  const normalized =
    types === undefined ? null : Array.isArray(types) ? [...types] : [types];
  return (target, propertyKey) => {
    const ctor = target.constructor;
    let list = SIGNAL_HANDLER_METADATA.get(ctor);
    if (!list) {
      list = [];
      SIGNAL_HANDLER_METADATA.set(ctor, list);
    }
    list.push({
      methodName: propertyKey,
      types: normalized,
    });
  };
}
function useSignal(typeOrHandler, maybeHandler) {
  const container = useIocContext().container;
  const isFilter =
    typeof typeOrHandler === "string" ||
    typeof typeOrHandler === "symbol" ||
    Array.isArray(typeOrHandler);
  const activeHandler = isFilter ? maybeHandler : typeOrHandler;
  const types = useMemo(() => {
    if (!isFilter) {
      return null;
    }
    if (Array.isArray(typeOrHandler)) {
      return typeOrHandler;
    }
    return [typeOrHandler];
  }, [typeOrHandler, isFilter]);
  const handlerRef = useRef(activeHandler);
  useEffect(() => {
    handlerRef.current = activeHandler;
  });
  useEffect(() => {
    const bus = container.get(SIGNAL_BUS_TOKEN);
    return bus.subscribe((signal) => {
      if (types !== null && !types.includes(signal.type)) {
        return;
      }
      handlerRef.current?.(signal);
    });
  }, [container, types]);
}
function useSignalEmitter() {
  const container = useIocContext().container;
  return useCallback(
    (signal) => {
      container.get(SIGNAL_BUS_TOKEN).emit(signal);
    },
    [container],
  );
}
function noop() {}
export {
  AbstractService,
  Action,
  Computed,
  DeepObservable,
  INITIAL_STATE_SHARED_TOKEN as INITIAL_STATE,
  InitialState,
  IocProvider,
  Observable,
  OnQuery,
  OnSignal,
  RefObservable,
  ShallowObservable,
  applyInitialState,
  bindService,
  createIocContainer,
  createServicesProvider,
  emitSignal,
  forwardRef,
  noop,
  query,
  useContainer,
  useContainerRevision,
  useQueryCaller,
  useQueryHandler,
  useService,
  useSignal,
  useSignalEmitter,
  useSyncQueryCaller,
};
