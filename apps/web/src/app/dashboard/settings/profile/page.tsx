import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";
import { SyncLocale } from "./sync-locale";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Check if cookie needs to be synced with database
  const cookieStore = await cookies();
  const currentCookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const dbLocale = profile?.locale || "nl";
  const needsSync = currentCookieLocale !== dbLocale;

  const t = await getTranslations("settings.profile");

  return (
    <div className="max-w-2xl">
      {/* Sync locale cookie with database if needed */}
      {needsSync && <SyncLocale locale={dbLocale} />}
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("subtitle")}
        </p>
      </div>

      <ProfileForm 
        profile={{
          id: user.id,
          email: user.email || profile?.email || "",
          full_name: profile?.full_name || "",
          avatar_url: profile?.avatar_url || "",
          locale: profile?.locale || "nl",
          distance_unit: profile?.distance_unit || "km",
          experience_level: profile?.experience_level || null,
          weekly_available_hours: profile?.weekly_available_hours || 5,
          preferred_run_days: profile?.preferred_run_days || ["tuesday", "thursday", "saturday"],
        }}
      />
    </div>
  );
}

