// List 2: pre-built clickable search links for sites where scraping isn't
// permitted. No job data is pulled here - links only, regenerated on demand
// so combinations rotate.
import type { CountryConfig } from "../types";

const TITLE_VARIANTS = ["Data Engineer", "Analytics Engineer", "Data Platform Engineer"];
const SPONSORSHIP_KEYWORDS = ["visa sponsorship", "relocation", "work permit"];

export interface SearchLink {
  label: string;
  url: string;
  title: string;
  country: string;
}

function q(s: string) {
  return encodeURIComponent(s);
}

function linkedinUrl(title: string, country: string, keyword: string) {
  return `https://www.linkedin.com/jobs/search/?keywords=${q(`${title} ${keyword}`)}&location=${q(country)}`;
}
function indeedUrl(title: string, country: string, keyword: string) {
  return `https://www.indeed.com/jobs?q=${q(`${title} ${keyword}`)}&l=${q(country)}`;
}
function glassdoorUrl(title: string, country: string, keyword: string) {
  return `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q(`${title} ${keyword} ${country}`)}`;
}
function googleOperatorUrl(title: string, country: string, keyword: string, site: string) {
  return `https://www.google.com/search?q=${q(`site:${site} "${title}" ${country} "${keyword}"`)}`;
}
function euresUrl(title: string, country: string) {
  return `https://europa.eu/eures/portal/jv-se/search?page=1&keywordsQuery=${q(title)}&position=1&countryCode=${country.slice(0, 2).toUpperCase()}`;
}
function makeItInGermanyUrl(title: string) {
  return `https://www.make-it-in-germany.com/en/jobs?query=${q(title)}`;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateLinks(countries: CountryConfig[]): SearchLink[] {
  const targetCountries = countries.filter((c) => c.tier === 1 || c.tier === 2).map((c) => c.country);
  const links: SearchLink[] = [];

  for (const country of targetCountries) {
    for (const title of TITLE_VARIANTS) {
      for (const keyword of SPONSORSHIP_KEYWORDS) {
        links.push({ label: `LinkedIn — ${title} · ${country} · "${keyword}"`, url: linkedinUrl(title, country, keyword), title, country });
        links.push({ label: `Indeed — ${title} · ${country} · "${keyword}"`, url: indeedUrl(title, country, keyword), title, country });
        links.push({ label: `Glassdoor — ${title} · ${country} · "${keyword}"`, url: glassdoorUrl(title, country, keyword), title, country });
        links.push({ label: `Google → linkedin.com/jobs — ${title} · ${country} · "${keyword}"`, url: googleOperatorUrl(title, country, keyword, "linkedin.com/jobs"), title, country });
        links.push({ label: `Google → indeed.com — ${title} · ${country} · "${keyword}"`, url: googleOperatorUrl(title, country, keyword, "indeed.com"), title, country });
      }
    }
    for (const title of TITLE_VARIANTS) {
      links.push({ label: `EURES — ${title} · ${country}`, url: euresUrl(title, country), title, country });
    }
  }

  if (targetCountries.includes("Germany")) {
    for (const title of TITLE_VARIANTS) {
      links.push({ label: `Make it in Germany — ${title}`, url: makeItInGermanyUrl(title), title, country: "Germany" });
    }
  }

  return shuffle(links);
}
