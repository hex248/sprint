import { Fragment, type SubmitEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BREATHING_ROOM } from "@/lib/layout";

import { useChat, useModels, useSelectedOrganisation, useSelectedProject } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import Avatar from "./avatar";
import { useAuthenticatedSession } from "./session-provider";
import { IconButton } from "./ui/icon-button";
import { Input } from "./ui/input";

export function Chat({ setHighlighted }: { setHighlighted: (ids: number[]) => void }) {
  const { user } = useAuthenticatedSession();
  const selectedOrganisation = useSelectedOrganisation();
  const selectedProject = useSelectedProject();
  const chat = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<string>("");
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const models = useModels(isOpen);

  useEffect(() => {
    if (models.data && models.data.length > 0 && !selectedModel) {
      setSelectedModel(models.data[0].id);
    }
  }, [models.data, selectedModel]);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    if (!message.trim()) return;
    if (!selectedOrganisation || !selectedProject) {
      setError("Please select an organisation and project first");
      return;
    }

    setError(null);
    setResponse("");
    setHighlighted([]);
    setLastUserMessage(message.trim());

    try {
      const data = await chat.mutateAsync({
        orgId: selectedOrganisation.Organisation.id,
        projectId: selectedProject.Project.id,
        message: message.trim(),
        model: selectedModel || "trinity-large-preview-free",
      });
      setResponse(data.text);
      setHighlighted(data.highlighted_issues);
      setMessage("");
    } catch (err) {
      const errorMessage = parseError(err as Error);
      setError(errorMessage);
    }
  };

  return (
    <>
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full"
        size="lg"
        variant="outline"
      >
        <Icon icon={isOpen ? "x" : "handsUp"} className="size-5" />
      </IconButton>

      {isOpen && (
        <div className="fixed bottom-18 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl mx-4 bg-background border shadow-xl">
          <div className={`flex flex-col p-${BREATHING_ROOM} gap-${BREATHING_ROOM}`}>
            <form onSubmit={handleSubmit} className={`flex flex-col gap-${BREATHING_ROOM}`}>
              {lastUserMessage && (
                <div className={`p-2 border flex items-center gap-2 text-sm`}>
                  <Avatar
                    name={user.name}
                    username={user.username}
                    avatarURL={user.avatarURL}
                    size={6}
                    textClass={"text-md"}
                    strong
                  />
                  <p className="whitespace-pre-wrap">{lastUserMessage}</p>
                </div>
              )}
              {(chat.isPending || response) && (
                <div className={`p-2 border flex items-center gap-2 text-sm`}>
                  <img src={"/favicon.svg"} className="w-9" alt={"sprint icon"} />

                  {!response && (
                    <div className="flex justify-center">
                      <Icon
                        icon="loader"
                        size={24}
                        className="animate-[spin_3s_linear_infinite]"
                        color={"var(--personality"}
                      />
                    </div>
                  )}

                  {response && (
                    <p className="whitespace-pre-wrap flex-1">
                      {response.split("\n").map((line, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: <>
                        <Fragment key={index}>
                          {line}
                          <br />
                        </Fragment>
                      ))}
                    </p>
                  )}
                </div>
              )}
              <div className={`flex items-center gap-${BREATHING_ROOM}`}>
                {models.data && models.data.length > 0 && (
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-fit text-[12px]" chevronClassName="hidden">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent
                      side="top"
                      position="popper"
                      align="start"
                      className="data-[side=top]:translate-x-0"
                    >
                      {models.data.map((model) => (
                        <SelectItem key={model.id} value={model.id} className="text-[12px]">
                          {model.name.replace(" Free", "").replace(" Preview", "")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                  placeholder={`Ask me anything about the ${selectedProject?.Project.name || "..."} project...`}
                  disabled={chat.isPending}
                  showCounter={false}
                />

                <Button
                  type="submit"
                  disabled={
                    chat.isPending ||
                    !message.trim() ||
                    !selectedOrganisation ||
                    !selectedProject ||
                    selectedModel.length < 1
                  }
                >
                  {chat.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>

            {}
            {error && (
              <div className="">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
