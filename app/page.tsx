import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { detectAcceptLanguage } from "@/lib/native-language";
import { LandingClient } from "./LandingClient";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const headerList = await headers();
  const initialLocale = detectAcceptLanguage(headerList.get("accept-language"));

  return <LandingClient initialLocale={initialLocale} />;
}
