import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Company, CountryConfig } from "../types";

export default function Settings() {
  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState<{ ats: "greenhouse" | "lever"; name: string; token: string }>({
    ats: "greenhouse",
    name: "",
    token: "",
  });

  async function load() {
    const { data: c } = await supabase.from("country_config").select("*").order("tier");
    setCountries((c as CountryConfig[]) || []);
    const { data: co } = await supabase.from("companies").select("*").order("ats");
    setCompanies((co as Company[]) || []);
  }

  useEffect(() => {
    load();
  }, []);

  function updateCountryField(country: string, field: keyof CountryConfig, value: any) {
    setCountries((prev) => prev.map((c) => (c.country === country ? { ...c, [field]: value } : c)));
  }

  async function saveCountry(country: CountryConfig) {
    const { error } = await supabase
      .from("country_config")
      .update({
        tier: country.tier,
        visa_route: country.visa_route,
        salary_threshold: country.salary_threshold,
        salary_threshold_shortage: country.salary_threshold_shortage,
        adzuna_code: country.adzuna_code,
        jooble_key: country.jooble_key,
      })
      .eq("country", country.country);
    setMessage(error ? error.message : `Saved ${country.country}.`);
  }

  async function addCompany() {
    if (!newCompany.name || !newCompany.token) return;
    const { error } = await supabase.from("companies").insert(newCompany);
    if (error) {
      setMessage(error.message);
      return;
    }
    setNewCompany({ ats: "greenhouse", name: "", token: "" });
    load();
  }

  async function removeCompany(id: string) {
    await supabase.from("companies").delete().eq("id", id);
    load();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-500">
          API keys (Adzuna, Anthropic) are configured as Supabase Edge Function secrets - see the README, not here.
          Jooble is the exception: its keys are issued per-country (see the Jooble key column below), so they're
          stored per-row in country_config instead of as a single global secret.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Country config</h2>
        <p className="text-sm text-slate-500 mb-3">
          Salary thresholds drive the salary pass/fail scoring signal. Edit and save per row when a
          threshold changes - re-verify against each country's official source before trusting it.
        </p>
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-3 py-2">Country</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Visa route</th>
                <th className="px-3 py-2">Salary threshold</th>
                <th className="px-3 py-2">Adzuna code</th>
                <th className="px-3 py-2">Jooble key</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c.country} className="border-t">
                  <td className="px-3 py-2 font-medium">{c.country}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={c.tier}
                      onChange={(e) => updateCountryField(c.country, "tier", Number(e.target.value))}
                      className="w-14 border rounded px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={c.visa_route}
                      onChange={(e) => updateCountryField(c.country, "visa_route", e.target.value)}
                      className="w-56 border rounded px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={c.salary_threshold ?? ""}
                      onChange={(e) =>
                        updateCountryField(c.country, "salary_threshold", e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-28 border rounded px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={c.adzuna_code ?? ""}
                      onChange={(e) => updateCountryField(c.country, "adzuna_code", e.target.value || null)}
                      className="w-16 border rounded px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={c.jooble_key ?? ""}
                      onChange={(e) => updateCountryField(c.country, "jooble_key", e.target.value || null)}
                      placeholder="from <cc>.jooble.org/api/about"
                      className="w-40 border rounded px-1 py-0.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => saveCountry(c)} className="text-xs border rounded px-2 py-1">
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message && <p className="text-sm text-slate-500 mt-2">{message}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Greenhouse / Lever companies</h2>
        <p className="text-sm text-slate-500 mb-3">
          International-hiring employers whose public job board API we pull from directly. Verify the
          token matches the company's real board URL slug before relying on results.
        </p>
        <div className="overflow-x-auto bg-white rounded-lg border mb-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-3 py-2">ATS</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Token</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">{c.ats}</td>
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">{c.token}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => removeCompany(c.id)} className="text-xs text-red-600">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-2 items-end">
          <select
            value={newCompany.ats}
            onChange={(e) => setNewCompany((v) => ({ ...v, ats: e.target.value as "greenhouse" | "lever" }))}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="greenhouse">greenhouse</option>
            <option value="lever">lever</option>
          </select>
          <input
            placeholder="Display name"
            value={newCompany.name}
            onChange={(e) => setNewCompany((v) => ({ ...v, name: e.target.value }))}
            className="border rounded px-2 py-1 text-sm"
          />
          <input
            placeholder="Board token"
            value={newCompany.token}
            onChange={(e) => setNewCompany((v) => ({ ...v, token: e.target.value }))}
            className="border rounded px-2 py-1 text-sm"
          />
          <button onClick={addCompany} className="text-sm border rounded px-3 py-1.5">
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
