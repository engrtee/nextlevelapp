import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import Nav from "./components/Nav";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CandidateProfile from "./pages/CandidateProfile";
import Tracking from "./pages/Tracking";
import Settings from "./pages/Settings";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<CandidateProfile />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
