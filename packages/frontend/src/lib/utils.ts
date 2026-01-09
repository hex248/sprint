import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function issueID(key: string, num: number) {
    return `${key}-${num.toString().padStart(3, "0")}`;
}

export function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
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
