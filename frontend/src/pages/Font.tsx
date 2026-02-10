const WEIGHTS = [
  200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700,
];

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog 0123456789.";

export default function Font() {
  return (
    <main className="min-h-screen font-mono">
      <div className="mx-auto w-fit px-8 py-10">
        <h1 className="text-2xl font-500">Commit Mono</h1>
        <div className="mt-6 flex flex-col divide-y divide-foreground/30">
          {WEIGHTS.map((weight) => (
            <div key={weight} className="grid grid-cols-[42px_1fr] items-center gap-3 px-3 py-3">
              <span className="text-sm" style={{ fontWeight: weight }}>
                {weight}
              </span>
              <span style={{ fontWeight: weight }}>{SAMPLE_TEXT}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
