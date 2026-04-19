import { Component, createElement, ReactNode } from "react";

export class ErrorLogBoundary extends Component {
  public state = { error: null as Error | null };

  public componentDidCatch(error: Error): void {
    this.setState({ error });
  }

  public render(): ReactNode {
    return this.state.error
      ? createElement("div", { id: "error-message" }, this.state.error.message)
      : this.props.children;
  }
}
