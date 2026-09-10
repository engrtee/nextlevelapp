import { useState } from "react";
import type { Listing } from "../types";
import { generateMaterials } from "../lib/edgeFunctions";
import { buildDocxBlob, buildPdfBlob, buildTextBlob, downloadBlob } from "../lib/resumeBuilder";
import { supabase } from "../lib/supabaseClient";

function Badge({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "neutral" }) {
  const toneClass =
    tone === "good" ? "bg-green-100 text-green-800" : tone === "bad" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700";
  return (
    <span className={`text-xs px-2 py-1 rounded ${toneClass}`}>
      {label}: {value}
    </span>
  );
}

function toneFor(status: string | null | undefined): "good" | "bad" | "neutral" {
  if (status === "pass" || status === "yes") return "good";
  if (status === "fail" || status === "no") return "bad";
  return "neutral";
}

export default function JobCard({
  job,
  onStatusChange,
}: {
  job: Listing;
  onStatusChange: (id: string, status: Listing["status"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<{ resume_text: string; cover_letter_text: string } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateMaterials(job.id);
      setMaterials(result);
    } catch (e: any) {
      setError(e.message || "Failed to generate materials.");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(status: Listing["status"]) {
    await supabase.from("listings").update({ status }).eq("id", job.id);
    onStatusChange(job.id, status);
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <button
        className="w-full text-left px-4 py-3 flex items-center justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <span className="font-semibold">[{Math.round(job.score ?? 0)}]</span>{" "}
          <span>{job.title}</span> — <span className="text-slate-500">{job.company} ({job.country})</span>
        </div>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          <div className="flex flex-wrap gap-2">
            <Badge label="Score" value={`${Math.round(job.score ?? 0)}/100`} tone="neutral" />
            <Badge label="Salary vs threshold" value={job.salary_status || "unclear"} tone={toneFor(job.salary_status)} />
            <Badge label="Shortage match" value={job.shortage_status || "unclear"} tone={toneFor(job.shortage_status)} />
            <Badge label="Country tier" value={String(job.tier ?? "-")} tone="neutral" />
            {job.country === "UK" && (
              <Badge
                label="UK sponsor register"
                value={
                  job.licensed_sponsor === true
                    ? "matched"
                    : job.licensed_sponsor === false
                      ? "not found"
                      : "unknown"
                }
                tone={job.licensed_sponsor === true ? "good" : "neutral"}
              />
            )}
          </div>
          {job.country === "UK" && job.licensed_sponsor === false && (
            <p className="text-xs text-slate-500">
              Not found under this exact name in the Home Office Skilled Worker sponsor register - this
              doesn't rule out sponsorship (trading names, agencies, and recent licence changes can cause a
              miss). Verify at{" "}
              <a
                href="https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                the official register
              </a>
              .
            </p>
          )}

          <p className="text-sm"><span className="font-medium">Visa route:</span> {job.visa_route || "-"}</p>
          <p className="text-sm"><span className="font-medium">Why this scored well:</span> {job.score_reason || "-"}</p>
          {job.url && (
            <a href={job.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
              Open listing
            </a>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-slate-500">Job description</summary>
            <p className="whitespace-pre-wrap mt-2">{job.description}</p>
          </details>

          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-slate-900 text-white text-sm rounded px-3 py-2 disabled:opacity-50"
            >
              {loading ? "Calling Claude API..." : "Generate tailored resume + cover letter"}
            </button>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>

          {materials && (
            <div className="space-y-3 pt-2">
              <div>
                <h4 className="font-medium text-sm mb-1">Tailored resume</h4>
                <textarea readOnly value={materials.resume_text} className="w-full border rounded p-2 text-sm h-48" />
                <div className="flex gap-2 mt-2">
                  <button
                    className="text-xs border rounded px-2 py-1"
                    onClick={async () => downloadBlob(await buildDocxBlob(materials.resume_text), `resume_${job.id}.docx`)}
                  >
                    Download .docx
                  </button>
                  <button
                    className="text-xs border rounded px-2 py-1"
                    onClick={() => downloadBlob(buildPdfBlob(materials.resume_text), `resume_${job.id}.pdf`)}
                  >
                    Download .pdf
                  </button>
                  <button
                    className="text-xs border rounded px-2 py-1"
                    onClick={() => downloadBlob(buildTextBlob(materials.resume_text), `resume_${job.id}.txt`)}
                  >
                    Download .txt (ATS paste)
                  </button>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Cover letter / application blurb</h4>
                <textarea readOnly value={materials.cover_letter_text} className="w-full border rounded p-2 text-sm h-36" />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <button onClick={() => setStatus("Viewed")} className="text-xs border rounded px-2 py-1">Mark Viewed</button>
            <button onClick={() => setStatus("Applied")} className="text-xs border rounded px-2 py-1">Mark Applied</button>
            <button onClick={() => setStatus("Dismissed")} className="text-xs border rounded px-2 py-1">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}
