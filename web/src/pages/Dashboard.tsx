import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { runSourcing } from "../lib/edgeFunctions";
import { generateLinks, type SearchLink } from "../lib/linkGenerator";
import type { CountryConfig, Listing } from "../types";
import JobCard from "../components/JobCard";

export default function Dashboard() {
  const [tab, setTab] = useState<"list1" | "list2">("list1");
  const [listings, setListings] = useState<Listing[]>([]);
  const [links, setLinks] = useState<SearchLink[]>([]);
  const [sourcing, setSourcing] = useState(false);
  const [sourcingMessage, setSourcingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadListings() {
    setLoading(true);
    const { data } = await supabase
      .from("listings")
      .select("*")
      .not("status", "in", "(Applied,Dismissed)")
      .order("score", { ascending: false });
    setListings((data as Listing[]) || []);
    setLoading(false);
  }

  async function loadLinks() {
    const { data } = await supabase.from("country_config").select("*");
    setLinks(generateLinks((data as CountryConfig[]) || []));
  }

  useEffect(() => {
    loadListings();
    loadLinks();
  }, []);

  async function handleRunSourcing() {
    setSourcing(true);
    setSourcingMessage(null);
    try {
      const summary = await runSourcing();
      setSourcingMessage(
        `New listings — Adzuna: ${summary.adzuna}, Greenhouse: ${summary.greenhouse}, Lever: ${summary.lever} ` +
          `(skipped, no country match: ${summary.skipped_no_country_match})` +
          (summary.errors.length ? ` — ${summary.errors.join("; ")}` : ""),
      );
      await loadListings();
    } catch (e: any) {
      setSourcingMessage(e.message || "Sourcing failed.");
    } finally {
      setSourcing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Job Sponsorship Search &amp; CV Tailoring Assistant</h1>
          <p className="text-sm text-slate-500">Sources and prepares applications for your review. Nothing is auto-submitted.</p>
        </div>
        <button
          onClick={handleRunSourcing}
          disabled={sourcing}
          className="bg-slate-900 text-white text-sm rounded px-3 py-2 disabled:opacity-50"
        >
          {sourcing ? "Sourcing..." : "Run sourcing now"}
        </button>
      </div>
      {sourcingMessage && <p className="text-sm text-slate-600 bg-slate-100 rounded p-2">{sourcingMessage}</p>}

      <div className="flex gap-4 border-b">
        <button
          className={`pb-2 text-sm font-medium ${tab === "list1" ? "border-b-2 border-slate-900" : "text-slate-500"}`}
          onClick={() => setTab("list1")}
        >
          List 1 — Sourced &amp; Scored
        </button>
        <button
          className={`pb-2 text-sm font-medium ${tab === "list2" ? "border-b-2 border-slate-900" : "text-slate-500"}`}
          onClick={() => setTab("list2")}
        >
          List 2 — Manual Search Links
        </button>
      </div>

      {tab === "list1" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <>
              <p className="text-sm text-slate-500">{listings.length} active listing(s).</p>
              {listings.map((job) => (
                <JobCard key={job.id} job={job} onStatusChange={loadListings} />
              ))}
            </>
          )}
        </div>
      )}

      {tab === "list2" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Ready-to-click search links for sites where automated scraping isn't permitted. No job data is pulled.
            </p>
            <button onClick={loadLinks} className="text-sm border rounded px-3 py-1.5">Refresh links</button>
          </div>
          <ul className="space-y-1">
            {links.map((link, i) => (
              <li key={i}>
                <a href={link.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
