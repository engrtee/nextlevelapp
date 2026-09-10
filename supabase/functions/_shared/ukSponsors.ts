// UK Home Office Register of Licensed Sponsors (Worker & Temporary Worker) -
// official, publicly downloadable CSV, filtered to the Skilled Worker route
// (the route this app's UK config targets - a licence for another route,
// e.g. Seasonal Worker, doesn't mean the org can sponsor Skilled Worker).
// The direct file URL changes with every government update (dated filename),
// so we resolve it via GOV.UK's stable Content API rather than hardcoding a
// URL that would go stale.
const CONTENT_API_URL =
  "https://www.gov.uk/api/content/government/publications/register-of-licensed-sponsors-workers";
const TARGET_ROUTE = "Skilled Worker";

export function normalizeSponsorName(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[.,'"]/g, "")
    .replace(/\b(LIMITED|LTD|PLC|LLP|LLC|INC|CORPORATION|CORP)\b/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unquoteCsvField(field: string): string {
  const trimmed = field.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }
  return trimmed;
}

// The register's last 4 columns (Town/City, County, Type & Rating, Route)
// never contain a comma, so splitting from the right and rejoining the
// remainder as the org name survives the rows where the organisation name
// itself contains one (proper CSV quoting is used there).
function parseSkilledWorkerOrgNames(csvText: string): string[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const names: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = lines[i].split(",");
    if (fields.length < 5) continue;
    const route = fields[fields.length - 1].trim();
    if (route !== TARGET_ROUTE) continue;
    const orgField = unquoteCsvField(fields.slice(0, fields.length - 4).join(","));
    if (orgField) names.push(orgField);
  }
  return names;
}

export async function fetchUkSponsorRegister(): Promise<Set<string>> {
  const contentResp = await fetch(CONTENT_API_URL);
  if (!contentResp.ok) throw new Error(`GOV.UK content API returned ${contentResp.status}`);
  const content = await contentResp.json();
  const attachment = (content.details?.attachments || []).find(
    (a: any) => a.content_type === "text/csv" || (a.url || "").endsWith(".csv"),
  );
  if (!attachment?.url) throw new Error("Could not find CSV attachment on GOV.UK register page");

  const csvResp = await fetch(attachment.url);
  if (!csvResp.ok) throw new Error(`Register CSV fetch returned ${csvResp.status}`);
  const csvText = await csvResp.text();

  const names = new Set<string>();
  for (const orgName of parseSkilledWorkerOrgNames(csvText)) {
    names.add(normalizeSponsorName(orgName));
    // Franchise/sole-trader rows are often "Legal Name T/A Trading Name" -
    // job postings usually show the trading name, so index both.
    const taMatch = orgName.match(/\bT\/A\b(.+)$/i) || orgName.match(/\btrading as\b(.+)$/i);
    if (taMatch) names.add(normalizeSponsorName(taMatch[1]));
  }
  return names;
}

export function isLicensedSponsor(companyName: string, register: Set<string>): boolean | null {
  if (!companyName || companyName === "Unknown") return null;
  return register.has(normalizeSponsorName(companyName));
}
