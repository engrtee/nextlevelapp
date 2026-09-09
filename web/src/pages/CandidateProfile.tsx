import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { extractText } from "../lib/cvParser";

export default function CandidateProfile() {
  const [content, setContent] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [cvFilename, setCvFilename] = useState<string | null>(null);
  const [cvContent, setCvContent] = useState<string>("");
  const [cvError, setCvError] = useState<string | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: profile } = await supabase.from("candidate_profile").select("content").eq("id", 1).maybeSingle();
      setContent(profile?.content || "");

      const { data: cv } = await supabase.from("candidate_cv").select("filename, content").eq("id", 1).maybeSingle();
      setCvFilename(cv?.filename || null);
      setCvContent(cv?.content || "");
    })();
  }, []);

  async function handleSaveProfile() {
    setSavingProfile(true);
    setSavedMessage(null);
    const { error } = await supabase
      .from("candidate_profile")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSavingProfile(false);
    setSavedMessage(error ? error.message : "Saved.");
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvError(null);
    setCvUploading(true);
    try {
      const text = await extractText(file);
      const { error } = await supabase
        .from("candidate_cv")
        .update({ filename: file.name, content: text, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      setCvFilename(file.name);
      setCvContent(text);
    } catch (err: any) {
      setCvError(err.message || "Could not parse CV.");
    } finally {
      setCvUploading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Candidate Profile</h1>
        <p className="text-sm text-slate-500">
          This document is fed into every resume/cover letter generation call as persistent context.
          Keep it honest and current - the tailoring engine is instructed never to claim anything
          beyond what's written here.
        </p>
      </div>

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded p-3 text-sm font-mono h-[500px]"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="bg-slate-900 text-white text-sm rounded px-3 py-2 disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save"}
          </button>
          {savedMessage && <span className="text-sm text-slate-500">{savedMessage}</span>}
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-1">CV</h2>
        <p className="text-sm text-slate-500 mb-3">
          Upload your CV (PDF or DOCX). It's parsed in your browser and stored as tailoring context -
          used alongside the profile above and each specific job posting.
        </p>
        <input type="file" accept=".pdf,.docx" onChange={handleCvUpload} disabled={cvUploading} />
        {cvUploading && <p className="text-sm text-slate-500 mt-2">Parsing...</p>}
        {cvError && <p className="text-sm text-red-600 mt-2">{cvError}</p>}
        {cvFilename && (
          <p className="text-sm text-slate-600 mt-2">
            Current CV: <span className="font-medium">{cvFilename}</span> ({cvContent.length} chars parsed)
          </p>
        )}
      </div>
    </div>
  );
}
