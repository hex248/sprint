import type { IssueImportJiraCsvResult } from "@sprint/shared";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { useImportJiraCsvIssues } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn } from "@/lib/utils";

export function IssueImportJiraDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
}) {
  const importJiraCsvIssues = useImportJiraCsvIssues();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IssueImportJiraCsvResult | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const filePickerActiveRef = useRef(false);

  useEffect(() => {
    const onWindowFocus = () => {
      if (!filePickerActiveRef.current) return;
      window.setTimeout(() => {
        filePickerActiveRef.current = false;
      }, 500);
    };

    window.addEventListener("focus", onWindowFocus);
    return () => {
      window.removeEventListener("focus", onWindowFocus);
    };
  }, []);

  const reset = () => {
    setImporting(false);
    setError(null);
    setResult(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && filePickerActiveRef.current) {
      return;
    }
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset();
    }
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!projectId) {
      setError("select a project first");
      return;
    }

    setError(null);
    setResult(null);
    setImporting(true);

    try {
      const data = await importJiraCsvIssues.mutateAsync({ file, projectId });
      setResult(data);

      toast.success(`Imported ${data.importedCount} issues`, { dismissible: false });
      if (data.skippedCount > 0) {
        toast.error(`Skipped ${data.skippedCount} rows. Review errors in dialog.`, {
          dismissible: false,
        });
      } else {
        handleOpenChange(false);
      }
    } catch (err) {
      const message = parseError(err as Error);
      setError(message);
      toast.error(`Error importing Jira CSV: ${message}`, { dismissible: false });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("w-md", error && "border-destructive")}
        onInteractOutside={(event) => {
          if (filePickerActiveRef.current) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (filePickerActiveRef.current) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Import from Jira (.csv)</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <Label className="text-sm text-muted-foreground">
            Required mapping: Summary, Description, Status, Issue Type.
          </Label>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={importing || !projectId}
            onClick={() => {
              filePickerActiveRef.current = true;
              inputRef.current?.click();
            }}
          >
            <Icon icon="upload" size={16} />
            {importing ? "Importing..." : "Choose CSV"}
          </Button>

          {result && (
            <div className="rounded border p-3 text-sm space-y-2">
              <Label className="text-sm">
                Imported {result.importedCount} of {result.totalRows} rows
              </Label>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  {result.errors.slice(0, 5).map((rowError) => (
                    <Label
                      key={`${rowError.row}-${rowError.message}`}
                      className="text-sm text-destructive block"
                    >
                      Row {rowError.row}: {rowError.message}
                    </Label>
                  ))}
                  {result.errors.length > 5 && (
                    <Label className="text-sm text-muted-foreground block">
                      +{result.errors.length - 5} more errors
                    </Label>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-end justify-end w-full text-xs -mb-2 -mt-1">
            {error ? (
              <Label className="text-destructive text-sm">{error}</Label>
            ) : (
              <Label className="opacity-0 text-sm">a</Label>
            )}
          </div>

          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={importing}>
                Close
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
