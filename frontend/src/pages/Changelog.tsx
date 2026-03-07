import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import remarkGfm from "remark-gfm";
import Loading from "@/components/loading";
import ThemeToggle from "@/components/theme-toggle";

export default function Changelog() {
  const [markdown, setMarkdown] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/changelog.md", { cache: "no-store" });
      const content = await response.text();
      setMarkdown(content);
      setIsLoading(false);
    };

    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-personality selection:text-background">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-personality transition-colors"
          >
            <span>Back home</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12">
        {isLoading ? (
          <Loading message={"Loading the latest updates"} />
        ) : (
          <article className="changelog-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
        )}
      </main>
    </div>
  );
}
