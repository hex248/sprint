export function isTimerRunning(timestamps: Date[]): boolean {
    return timestamps.length % 2 === 1;
}

export function calculateWorkTimeMs(timestamps: Date[]): number {
    let total = 0;
    for (let i = 0; i < timestamps.length; i += 2) {
        const start = timestamps[i];
        if (!start) break;
        const end = timestamps[i + 1] || new Date();
        total += end.getTime() - start.getTime();
    }
    return total;
}

export function calculateBreakTimeMs(timestamps: Date[]): number {
    let total = 0;
    for (let i = 1; i < timestamps.length - 1; i += 2) {
        const start = timestamps[i];
        const end = timestamps[i + 1];
        if (!start || !end) break;
        total += end.getTime() - start.getTime();
    }
    return total;
}
