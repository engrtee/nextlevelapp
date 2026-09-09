import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Single-user tool: the PIN is the password of one fixed Supabase Auth account
// (VITE_OWNER_EMAIL), created once via the Supabase dashboard. This keeps real
// RLS-level protection (auth.role() = 'authenticated') behind a low-friction
// PIN instead of asking for an email every time.
const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL as string;

export default function Login() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!OWNER_EMAIL) {
      setError("VITE_OWNER_EMAIL is not set - see web/.env.example.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: pin });
    setLoading(false);
    if (error) setError("Incorrect PIN.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-8 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Job Sponsorship Assistant</h1>
        <div>
          <label className="block text-sm font-medium mb-1">PIN</label>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full border rounded px-3 py-2 text-center text-lg tracking-widest"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Enter"}
        </button>
      </form>
    </div>
  );
}
