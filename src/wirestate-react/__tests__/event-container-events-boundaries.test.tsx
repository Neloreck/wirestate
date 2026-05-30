import { cleanup, fireEvent, render } from "@testing-library/react";
import { ContainerConfig } from "@wirestate/core";
import { useMemo, useState } from "react";

import { ContainerProvider, ChildContainerProvider, useEventEmitter, useEventsHandler } from "../index";

describe("react event container boundaries integration (child container essentials isolation)", () => {
  const COUNTER_EVENT: string = "COUNTER_EVENT";

  afterEach(() => {
    cleanup();
  });

  function EventPanel({ name }: { readonly name: string }) {
    const emit = useEventEmitter();
    const [events, setEvents] = useState<Array<string>>([]);

    useEventsHandler((event) => {
      if (event.type === COUNTER_EVENT) {
        setEvents((current) => [...current, `${name}:${String(event.payload)}`]);
      }
    });

    return (
      <>
        <button data-testid={`${name}-emit`} type={"button"} onClick={() => emit(COUNTER_EVENT, name)}>
          emit
        </button>

        <span data-testid={`${name}-events`}>{events.join(",") || "empty"}</span>
      </>
    );
  }

  function Application({ showChild }: { readonly showChild: boolean }) {
    const config: ContainerConfig = useMemo(() => ({}), []);

    return (
      <ContainerProvider config={config}>
        <EventPanel name={"root"} />

        {showChild ? (
          <ChildContainerProvider bindings={[]}>
            <EventPanel name={"child"} />
          </ChildContainerProvider>
        ) : null}
      </ContainerProvider>
    );
  }

  it("keeps events isolated between parent and child containers", () => {
    const { getByTestId, queryByTestId, rerender } = render(<Application showChild={true} />);

    fireEvent.click(getByTestId("root-emit"));

    expect(getByTestId("root-events").textContent).toBe("root:root");
    expect(getByTestId("child-events").textContent).toBe("empty");

    fireEvent.click(getByTestId("child-emit"));

    expect(getByTestId("root-events").textContent).toBe("root:root");
    expect(getByTestId("child-events").textContent).toBe("child:child");

    rerender(<Application showChild={false} />);

    expect(queryByTestId("child-events")).toBeNull();

    fireEvent.click(getByTestId("root-emit"));

    expect(getByTestId("root-events").textContent).toBe("root:root,root:root");

    rerender(<Application showChild={true} />);

    expect(getByTestId("child-events").textContent).toBe("empty");
  });
});
