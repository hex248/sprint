import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Loading from "@/components/loading";

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
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12">
        {isLoading ? (
          <Loading message={"Loading the latest updates"} />
        ) : (
          <article className="changelog-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
