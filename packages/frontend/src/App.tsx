import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Auth } from "@/components/auth-provider";
import Landing from "@/components/landing";
import LoginPage from "@/components/login-page";
import NotFound from "@/components/NotFound";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "@/Index";
import Test from "@/Test";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <BrowserRouter>
                <Routes>
                    {/* public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* authed routes */}
                    <Route
                        path="/app"
                        element={
                            <Auth>
                                <Index />
                            </Auth>
                        }
                    />
                    <Route
                        path="/test"
                        element={
                            <Auth>
                                <Test />
                            </Auth>
                        }
                    />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
