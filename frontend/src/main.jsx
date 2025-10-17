import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { ThemeProvider } from "./contexts/ThemeProvider.jsx";
import { GoalsProvider } from "./contexts/GoalsContext.tsx";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <GoalsProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </GoalsProvider>
  // </StrictMode>,
);
