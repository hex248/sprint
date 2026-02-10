import { Spinner } from "@/components/ui/spinner";

export default function Loading({ message, children }: { message?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-[100vh]">
      <Spinner className="size-6" />
      {message && <span className="text-xs px-2 py-1 border-2 border-input border-dashed">{message}</span>}
      {children}
    </div>
  );
}
