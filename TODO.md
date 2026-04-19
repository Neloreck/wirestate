## List of things to do before release / announcing

- [ ] Review createServicesProvider name, probably should be more generic
- [ ] Separation of global initial state and targeted key-state pairs
- [ ] For targeted key-state initial state pairs, merge initial states
  to ensure multiple providers can co-exist, review applyInitialStates logics
- [ ] Count references when deactivating service from provider,
  because if few providers provide same service it can be accidentally deactivated
- [ ] Simplify use signal hook, probably worth adding separate useSignals, usSignal and useSignalHandler
- [ ] Query data contract review - whether query responses should be boxed in object or 
  queryOptional methods should be introduced to work without exceptions
- [ ] More generic declaration of bindings to support scopes and async factories
- [ ] useOptionalInjection without exceptions?
- [ ] Proper re-export from mobx and inversify
- [ ] More test-utils, testing examples for real apps
- [ ] Add tests and increase coverage to at least 75%
- [ ] Add documentation
- [ ] Decide regarding store manager lib name
