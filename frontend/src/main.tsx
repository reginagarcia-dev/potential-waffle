import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { reportWebVitals } from "./lib/webVitals";
import { initSentry } from "./lib/sentry";

initSentry();
reportWebVitals();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
