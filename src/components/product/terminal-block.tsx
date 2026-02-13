import type { TerminalEntry } from "@/lib/mock-data";

export function TerminalBlock({ entries }: { entries: TerminalEntry[] }) {
  return (
    <div className="max-h-80 overflow-y-auto rounded-lg bg-zinc-900 p-4 font-mono text-sm">
      {entries.map((entry, i) => (
        <div key={i} className="mb-4 last:mb-0">
          <div className="text-green-400">
            <span className="select-none text-green-600">$ </span>
            {entry.command}
          </div>
          <pre className="mt-1 whitespace-pre-wrap text-zinc-300">
            {entry.output}
          </pre>
        </div>
      ))}
    </div>
  );
}
