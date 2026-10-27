import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import Admin from "./pages/Admin";

const isAdmin = /\/admin\/?$/.test(window.location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isAdmin ? <Admin /> : <App />}</StrictMode>,
);
