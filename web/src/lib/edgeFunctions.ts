import { supabase } from "./supabaseClient";
import type { GeneratedMaterials } from "../types";

async function invoke<T>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body: body ?? {} });
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && "error" in (data as any) && (data as any).error) {
    throw new Error((data as any).error as string);
  }
  return data as T;
}

export interface SourcingSummary {
  adzuna: number;
  greenhouse: number;
  lever: number;
  skipped_no_country_match: number;
  errors: string[];
}

export function runSourcing() {
  return invoke<SourcingSummary>("source-jobs");
}

export function generateMaterials(listingId: string, forceRegenerate = false) {
  return invoke<GeneratedMaterials>("generate-materials", { listing_id: listingId, force_regenerate: forceRegenerate });
}
