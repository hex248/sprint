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
