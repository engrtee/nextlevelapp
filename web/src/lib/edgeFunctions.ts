import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { GeneratedMaterials } from "../types";

async function invoke<T>(name: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body: body ?? {} });
  if (error) {
    // supabase-js doesn't surface the function's own error body by default -
    // any non-2xx response just says "non-2xx status code" unless we read it
    // ourselves from the raw Response on error.context.
    if (error instanceof FunctionsHttpError) {
      try {
        const errBody = await error.context.json();
        throw new Error(errBody?.error || error.message);
      } catch {
        throw new Error(error.message);
      }
    }
    throw new Error(error.message);
  }
  if (data && typeof data === "object" && "error" in (data as any) && (data as any).error) {
    throw new Error((data as any).error as string);
  }
  return data as T;
}

export interface SourcingSummary {
  adzuna: number;
  jooble: number;
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
