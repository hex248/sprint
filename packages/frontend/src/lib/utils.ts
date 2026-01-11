import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function issueID(key: string, num: number) {
    return `${key}-${num.toString().padStart(3, "0")}`;
}

export function getCsrfToken(): string | null {
    return sessionStorage.getItem("csrfToken");
}

export function setCsrfToken(token: string): void {
    sessionStorage.setItem("csrfToken", token);
}

export function clearAuth(): void {
    sessionStorage.removeItem("csrfToken");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedOrganisationId");
    localStorage.removeItem("selectedProjectId");
}

export function capitalise(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const ENV_SERVER_URL = import.meta.env.VITE_SERVER_URL?.trim();

export function getServerURL() {
    let serverURL =
        localStorage.getItem("serverURL") || // user-defined server URL
        ENV_SERVER_URL || // environment variable
        "https://eussi.ob248.com"; // fallback
    if (serverURL.endsWith("/")) {
        serverURL = serverURL.slice(0, -1);
    }
    return serverURL;
}

export function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
}
