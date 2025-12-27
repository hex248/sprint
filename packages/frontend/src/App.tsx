import { BrowserRouter, Route, Routes } from "react-router-dom";
import Account from "@/Account";
import { Auth } from "@/components/auth-provider";
import NotFound from "@/components/NotFound";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "@/Index";
import Organisations from "@/Organisations";
import Test from "@/Test";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Auth>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/settings/account" element={<Account />} />
                        <Route path="/settings/organisations" element={<Organisations />} />
                        <Route path="/test" element={<Test />} />
                        <Route path={"*"} element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </Auth>
        </ThemeProvider>
    );
}

export default App;
