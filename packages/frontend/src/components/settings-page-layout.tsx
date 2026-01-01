import type { UserRecord } from "@issue/shared";
import type { ReactNode } from "react";
import Header from "@/components/header";

export function SettingsPageLayout({ title, children }: { title: string; children?: ReactNode }) {
    const user = JSON.parse(localStorage.getItem("user") || "{}") as UserRecord;

    return (
        <main className="w-full h-screen flex flex-col">
            <Header user={user}>
                <div className="flex gap-1 items-center">
                    <h1 className="text-3xl font-600">{title}</h1>
                </div>
            </Header>

            <div className="flex flex-col items-center justify-center w-full flex-1 text-md">{children}</div>
        </main>
    );
}
