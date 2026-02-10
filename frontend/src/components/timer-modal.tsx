import { useState } from "react";
import { IssueTimer } from "@/components/issue-timer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";

export function TimerModal({ issueId, disabled }: { issueId: number; disabled?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Icon icon="timer" className="size-4" />
          Timer
        </Button>
      </DialogTrigger>
      <DialogContent className="w-xs" showCloseButton={false}>
        <IssueTimer issueId={issueId} onEnd={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
