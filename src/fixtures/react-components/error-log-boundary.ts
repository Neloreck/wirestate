import { Component, createElement, ReactNode } from "react";

import { Optional } from "../../wirestate-core/types/general";

interface ErrorLogBoundaryProps {
  readonly children?: ReactNode;
}

export class ErrorLogBoundary extends Component<ErrorLogBoundaryProps> {
  public state = { error: null as Optional<Error> };

  public componentDidCatch(error: Error): void {
    this.setState({ error });
  }

  public render(): ReactNode {
    return this.state.error
      ? createElement("div", { id: "error-message", "data-testid": "error-message" }, this.state.error.message)
      : this.props.children;
  }
}
