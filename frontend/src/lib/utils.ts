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
  localStorage.removeItem("selectedOrganisationSlug");
  localStorage.removeItem("selectedProjectId");
  localStorage.removeItem("selectedProjectKey");
  localStorage.removeItem("selectedIssueNumber");
}

export function capitalise(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const ENV_SERVER_URL = import.meta.env.VITE_SERVER_URL?.trim();
const ENV_WEBRTC_STUN_URLS = import.meta.env.VITE_WEBRTC_STUN_URLS?.trim();

export function getServerURL() {
  let serverURL =
    localStorage.getItem("serverURL") || // user-defined server URL
    ENV_SERVER_URL || // environment variable
    "https://server.sprintpm.org"; // fallback
  if (serverURL.endsWith("/")) {
    serverURL = serverURL.slice(0, -1);
  }
  return serverURL;
}

const DEFAULT_STUN_URLS = ["stun:stun.l.google.com:19302"];

export function getWebRTCStunUrls(): string[] {
  const raw = ENV_WEBRTC_STUN_URLS as string;
  if (!raw) {
    return DEFAULT_STUN_URLS;
  }

  const urls = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .filter((s) => s.startsWith("stun:") || s.startsWith("stuns:"));

  return urls.length > 0 ? urls : DEFAULT_STUN_URLS;
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

export const DARK_TEXT_COLOUR = "#0a0a0a";
const THRESHOLD = 0.6;

export const isLight = (hex: string): boolean => {
  const num = Number.parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > THRESHOLD;
};

export const unCamelCase = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (char) => char.toUpperCase());
};

export const formatDuration = (ms: number): string => {
  if (ms === 0) return "0s";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || (hours === 0 && minutes === 0)) parts.push(`${seconds}s`);

  return parts.join(" ") || "0s";
};
