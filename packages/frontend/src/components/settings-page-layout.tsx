import { Home } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SettingsPageLayout({ title, children }: { title: string; children?: ReactNode }) {
    return (
        <main className="w-full min-h-[100vh] flex flex-col items-start">
            <div className="flex items-center gap-4 w-full border-b px-2 py-2">
                <Button asChild variant="ghost" size="icon">
                    <Link to="/">
                        <Home />
                    </Link>
                </Button>

                <h1 className="text-3xl font-600">{title}</h1>
            </div>

            <div className="w-full px-4 py-4 text-md">{children}</div>
        </main>
    );
}
