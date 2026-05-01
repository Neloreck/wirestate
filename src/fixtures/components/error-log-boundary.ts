import { Component, createElement, ReactNode } from "react";

import { Optional } from "@/wirestate/types/general";

export class ErrorLogBoundary extends Component {
  public state = { error: null as Optional<Error> };

  public componentDidCatch(error: Error): void {
    this.setState({ error });
  }

  public render(): ReactNode {
    return this.state.error
      ? createElement("div", { id: "error-message" }, this.state.error.message)
      : this.props.children;
  }
}
