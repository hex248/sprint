import type { IssueChangedMessage } from "@sprint/shared";

export type IssueChangedEvent = IssueChangedMessage;

type RealtimePublisher = (event: IssueChangedEvent) => void;

let realtimePublisher: RealtimePublisher | null = null;

export function registerRealtimePublisher(publisher: RealtimePublisher) {
    realtimePublisher = publisher;
}

export function broadcastIssueChanged(event: Omit<IssueChangedEvent, "type">) {
    if (!realtimePublisher) {
        return;
    }

    realtimePublisher({
        type: "issue-changed",
        ...event,
    });
}
