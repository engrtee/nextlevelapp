import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Listing } from "../types";
import { downloadBlob } from "../lib/resumeBuilder";

const STATUSES = ["All", "New", "Viewed", "Applied", "Dismissed"] as const;

function toCsv(rows: Listing[]): string {
  const headers = ["title", "company", "country", "source", "score", "status", "date_found", "date_applied", "url"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const values = headers.map((h) => {
      const v = (r as any)[h];
      const s = v == null ? "" : String(v).replace(/"/g, '""');
      return `"${s}"`;
    });
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export default function Tracking() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("listings").select("*").order("date_found", { ascending: false });
      setListings((data as Listing[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => (filter === "All" ? listings : listings.filter((l) => l.status === filter)),
    [listings, filter],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tracking</h1>
        <button
          onClick={() => downloadBlob(new Blob([toCsv(filtered)], { type: "text/csv" }), "listings.csv")}
          className="text-sm border rounded px-3 py-1.5"
        >
          Export CSV
        </button>
      </div>

      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs rounded px-2 py-1 border ${filter === s ? "bg-slate-900 text-white" : "bg-white"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Country</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Found</th>
                <th className="px-3 py-2">Applied</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-3 py-2">
                    {l.url ? (
                      <a href={l.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {l.title}
                      </a>
                    ) : (
                      l.title
                    )}
                  </td>
                  <td className="px-3 py-2">{l.company}</td>
                  <td className="px-3 py-2">{l.country}</td>
                  <td className="px-3 py-2">{Math.round(l.score ?? 0)}</td>
                  <td className="px-3 py-2">{l.status}</td>
                  <td className="px-3 py-2">{new Date(l.date_found).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{l.date_applied ? new Date(l.date_applied).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
