import "reflect-metadata";
import "@/styles/index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Application } from "@/Application";
import { Provider } from "@/Provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider>
      <Application />
    </Provider>
  </StrictMode>,
);
