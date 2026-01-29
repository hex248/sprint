import { cn } from "@/lib/utils";

const FALLBACK_COLOURS = [
  "bg-teal-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-purple-500",
  "bg-lime-500",
  "bg-orange-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-green-500",
  "bg-red-500",
  "bg-violet-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-pink-500",
];

function hashStringToIndex(value: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return modulo === 0 ? 0 : hash % modulo;
}

function getInitials(name: string) {
  name = name.trim();

  const parts = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();

  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function OrgIcon({
  name,
  slug,
  iconURL,
  size,
  textClass = "text-md",
  className,
}: {
  name: string;
  slug: string;
  iconURL?: string | null;
  size?: number;
  textClass?: string;
  className?: string;
}) {
  const backgroundClass = FALLBACK_COLOURS[hashStringToIndex(slug, FALLBACK_COLOURS.length)];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm overflow-hidden",
        "text-white font-medium select-none",
        !iconURL && backgroundClass,
        `w-${size || 6}`,
        `h-${size || 6}`,
        className,
      )}
    >
      {iconURL ? (
        <img src={iconURL} alt={name} className={`rounded-md object-cover w-${size || 6} h-${size || 6}`} />
      ) : (
        <span className={cn(textClass)}>{getInitials(name)}</span>
      )}
    </div>
  );
}
