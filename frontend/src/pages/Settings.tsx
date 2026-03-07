import { useState } from "react";
import { SettingsAccount } from "@/components/settings-account";
import { SettingsOrganisation } from "@/components/settings-organisation";
import { SettingsProject } from "@/components/settings-project";
import TopBar from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { BREATHING_ROOM } from "@/lib/layout";

type SettingsSection = "account" | "organisation" | "project";

export default function Settings() {
  const [section, setSection] = useState<SettingsSection>("account");

  return (
    <main className={`w-full h-screen flex flex-col gap-${BREATHING_ROOM} p-${BREATHING_ROOM}`}>
      <TopBar showIssueForm={false} />

      <div className={`flex gap-${BREATHING_ROOM} min-h-0 flex-1`}>
        <aside className="w-52 shrink-0 border p-2 flex flex-col gap-2">
          <h1 className="text-lg font-600 px-2 py-1">Settings</h1>
          <Button
            variant={section === "account" ? "outline" : "ghost"}
            className="justify-start"
            onClick={() => setSection("account")}
          >
            Account
          </Button>
          <Button
            variant={section === "organisation" ? "outline" : "ghost"}
            className="justify-start"
            onClick={() => setSection("organisation")}
          >
            Organisation
          </Button>
          <Button
            variant={section === "project" ? "outline" : "ghost"}
            className="justify-start"
            onClick={() => setSection("project")}
          >
            Project
          </Button>
        </aside>

        <section className="min-w-0 min-h-0 flex-1 flex">
          {section === "account" && <SettingsAccount />}
          {section === "organisation" && <SettingsOrganisation />}
          {section === "project" && <SettingsProject />}
        </section>
      </div>
    </main>
  );
}
