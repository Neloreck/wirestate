import { Component, createElement, ReactNode } from "react";

import { Nullable } from "../types";

interface ErrorLogBoundaryProps {
  readonly children?: ReactNode;
}

export class ErrorLogBoundary extends Component<ErrorLogBoundaryProps> {
  public state = { error: null as Nullable<Error> };

  public componentDidCatch(error: Error): void {
    this.setState({ error });
  }

  public render(): ReactNode {
    return this.state.error
      ? createElement("div", { id: "error-message", "data-testid": "error-message" }, this.state.error.message)
      : this.props.children;
  }
}
