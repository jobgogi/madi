import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/client";

const ErrorCategorySchema = z.object({ code: z.string(), label: z.string() });
export type ErrorCategory = z.infer<typeof ErrorCategorySchema>;

export async function listErrorCategories(): Promise<ErrorCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("error_categories").select("code, label").order("code");
  if (error || !data) {
    if (error) console.error("listErrorCategories failed", error);
    return [];
  }
  return z.array(ErrorCategorySchema).parse(data);
}

export async function updateErrorCategoryLabel(code: string, label: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("error_categories").update({ label }).eq("code", code);
  if (error) {
    console.error("updateErrorCategoryLabel failed", error);
    return false;
  }
  return true;
}
