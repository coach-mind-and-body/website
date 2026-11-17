const ink = "oklch(0.20 0.015 50)";
const muted = "oklch(0.52 0.015 50)";

export type CoachFastingRow = {
  dateStr: string;
  didFast: boolean;
  hours: number | null;
  notes: string | null;
};

export function ClientFastingLogs({ rows }: { rows: CoachFastingRow[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: muted }}>
        Fasting
      </p>
      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: muted }}>
          No fasting logged yet.
        </p>
      ) : (
        rows.map((row) => (
          <div
            key={row.dateStr}
            className="rounded-lg p-2"
            style={{ background: "oklch(0.985 0.008 80)" }}
          >
            <p className="text-sm font-semibold" style={{ color: ink }}>
              {row.dateStr} · {row.didFast ? "Yes" : "No"}
              {row.hours != null ? ` · ${row.hours} hours` : ""}
            </p>
            {row.notes ? (
              <p className="text-xs whitespace-pre-wrap mt-1" style={{ color: muted }}>
                {row.notes}
              </p>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
