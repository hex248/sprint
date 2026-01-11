import "./App.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RequireAuth, SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import App from "@/pages/App";
import Font from "@/pages/Font";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Test from "@/pages/Test";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <BrowserRouter>
                <SessionProvider>
                    <Routes>
                        {/* public routes */}
                        <Route path="/" element={<Landing />} />
                        <Route path="/font" element={<Font />} />
                        <Route path="/login" element={<Login />} />

                        {/* authed routes */}
                        <Route
                            path="/app"
                            element={
                                <RequireAuth>
                                    <App />
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

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </SessionProvider>
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>,
);
