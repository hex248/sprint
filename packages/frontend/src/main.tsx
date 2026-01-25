import "./App.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryProvider } from "@/components/query-provider";
import { SelectionProvider } from "@/components/selection-provider";
import { RequireAuth, SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Font from "@/pages/Font";
import Issues from "@/pages/Issues";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Test from "@/pages/Test";
import Timeline from "@/pages/Timeline";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryProvider>
        <SessionProvider>
          <SelectionProvider>
            <BrowserRouter>
              <Routes>
                {/* public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/font" element={<Font />} />
                <Route path="/login" element={<Login />} />

                {/* authed routes */}
                <Route
                  path="/issues"
                  element={
                    <RequireAuth>
                      <Issues />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/test"
                  element={
                    <RequireAuth>
                      <Test />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/timeline"
                  element={
                    <RequireAuth>
                      <Timeline />
                    </RequireAuth>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster visibleToasts={1} duration={2000} />
          </SelectionProvider>
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
