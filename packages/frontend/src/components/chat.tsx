import { useState } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { useChatMutation, useSelectedOrganisation, useSelectedProject } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { IconButton } from "./ui/icon-button";
import { Input } from "./ui/input";

export function Chat() {
  const selectedOrganisation = useSelectedOrganisation();
  const selectedProject = useSelectedProject();
  const chatMutation = useChatMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;
    if (!selectedOrganisation || !selectedProject) {
      setError("Please select an organisation and project first");
      return;
    }

    setError(null);
    setResponse("");

    try {
      const data = await chatMutation.mutateAsync({
        orgId: selectedOrganisation.Organisation.id,
        projectId: selectedProject.Project.id,
        message: message.trim(),
      });
      setResponse(data.text);
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
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl mx-4 bg-background border shadow-xl">
          <div className="flex flex-col p-2">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              {response && (
                <div className="p-4 border max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{response}</p>
                </div>
              )}

              {chatMutation.isPending && (
                <div className="flex justify-center py-4">
                  <Icon icon="loader" size={32} className="animate-spin" />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Input
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                  placeholder={`Ask me anything about the ${selectedProject?.Project.name || "..."} project...`}
                  disabled={chatMutation.isPending}
                  showCounter={false}
                />

                <Button
                  type="submit"
                  disabled={
                    chatMutation.isPending || !message.trim() || !selectedOrganisation || !selectedProject
                  }
                >
                  {chatMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </form>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
