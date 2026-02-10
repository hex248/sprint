export function DataLoadingError({
  title = "Are you having network issues?",
  message = "We're having trouble loading your data.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6">
      <div className="max-w-md text-center space-y-2">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
