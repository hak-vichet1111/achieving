import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Initialize i18n before rendering
import "./i18n.ts";

import { ThemeProvider } from "./contexts/ThemeProvider.jsx";
import { GoalsProvider } from "./contexts/GoalsContext.tsx";
import { SpendingProvider } from "./contexts/SpendingContext.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <AuthProvider>
    <GoalsProvider>
      <SpendingProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SpendingProvider>
    </GoalsProvider>
  </AuthProvider>
  // </StrictMode>,
);
