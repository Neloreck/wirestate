import { createContext } from "@lit/context";
import { Container } from "@wirestate/core";

export const IOC_CONTAINER_KEY = Symbol("ContainerContext");

export const ContainerContext = createContext<Container>(IOC_CONTAINER_KEY);
