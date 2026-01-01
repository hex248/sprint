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

export async function resizeImageToSquare(file: File, targetSize: number = 256): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
        }

        img.onload = () => {
            canvas.width = targetSize;
            canvas.height = targetSize;

            const minDimension = Math.min(img.width, img.height);
            const startX = (img.width - minDimension) / 2;
            const startY = (img.height - minDimension) / 2;

            ctx.drawImage(img, startX, startY, minDimension, minDimension, 0, 0, targetSize, targetSize);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Failed to create blob"));
                    }
                },
                "image/png",
                0.9,
            );
        };

        img.onerror = () => {
            reject(new Error("Failed to load image"));
        };

        img.src = URL.createObjectURL(file);
    });
}
