import { Downasaur } from "@nsmr/pixelart-react";

export default function NotFound() {
  return (
    <div className={`w-full h-[100vh] flex flex-col items-center justify-center gap-4`}>
      <span className="-ml-14 -mb-7 -rotate-20 text-xl text-muted-foreground">?</span>
      <Downasaur size={72} color={"var(--personality)"} />
      <span className="text-7xl font-500">404</span>
      <span className="text-2xl font-400">Not Found</span>
    </div>
  );
}
