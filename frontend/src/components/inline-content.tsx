import { cn } from "@/lib/utils";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function toComparableUrl(url: string) {
  return url.replace(/[),.;:!?]+$/, "");
}

export function isImageUrl(url: string) {
  const normalized = toComparableUrl(url);
  const withoutQuery = normalized.split(/[?#]/)[0].toLowerCase();
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(withoutQuery);
}

export function extractImageUrls(text: string) {
  return Array.from(text.matchAll(URL_REGEX))
    .map((match) => toComparableUrl(match[0]))
    .filter((url) => isImageUrl(url));
}

export function InlineContent({
  text,
  className,
  linkify = true,
}: {
  text: string;
  className?: string;
  linkify?: boolean;
}) {
  const tokens = text.split(URL_REGEX);

  return (
    <div className={cn("text-sm whitespace-pre-wrap break-words", className)}>
      {tokens.map((token, index) => {
        const key = `${index}-${token.slice(0, 16)}`;
        if (!token) {
          return null;
        }

        const normalized = toComparableUrl(token);
        if (!token.startsWith("http://") && !token.startsWith("https://")) {
          return <span key={key}>{token}</span>;
        }

        if (isImageUrl(normalized)) {
          return (
            <img
              key={key}
              src={normalized}
              alt="inline attachment"
              className="my-2 max-h-80 w-auto max-w-full object-contain border border-border/60"
            />
          );
        }

        if (!linkify) {
          return <span key={key}>{normalized}</span>;
        }

        return (
          <a key={key} href={normalized} target="_blank" rel="noreferrer" className="underline break-all">
            {normalized}
          </a>
        );
      })}
    </div>
  );
}
