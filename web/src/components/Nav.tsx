import { NavLink } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/profile", label: "Candidate Profile" },
  { to: "/tracking", label: "Tracking" },
  { to: "/settings", label: "Settings" },
];

export default function Nav() {
  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
