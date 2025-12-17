"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Save, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserIdentity } from "@supabase/supabase-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
  profile: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
    locale: string;
    experience_level: string | null;
    weekly_available_hours: number;
    preferred_run_days: string[];
  };
}

const experienceLevelKeys = ["beginner", "intermediate", "advanced", "elite"] as const;
const weekDayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    locale: profile.locale,
    experience_level: profile.experience_level || "",
    weekly_available_hours: profile.weekly_available_hours,
    preferred_run_days: profile.preferred_run_days,
  });

  // Fetch linked identities on mount
  useEffect(() => {
    async function fetchIdentities() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUserIdentities();
      if (data?.identities) {
        setIdentities(data.identities);
      }
    }
    fetchIdentities();
  }, []);

  const googleIdentity = identities.find((i) => i.provider === "google");
  const emailIdentity = identities.find((i) => i.provider === "email");
  const hasMultipleIdentities = identities.length > 1;

  async function handleLinkGoogle() {
    setIsLinkingGoogle(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings/profile`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error linking Google:", error);
      toast.error(t("settings.profile.errorLinkingGoogle"));
      setIsLinkingGoogle(false);
    }
  }

  async function handleUnlinkGoogle() {
    if (!googleIdentity) return;
    
    setIsUnlinkingGoogle(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
      if (error) throw error;
      
      setIdentities((prev) => prev.filter((i) => i.provider !== "google"));
      toast.success(t("settings.profile.googleUnlinked"));
    } catch (error) {
      console.error("Error unlinking Google:", error);
      toast.error(t("settings.profile.errorUnlinkingGoogle"));
    } finally {
      setIsUnlinkingGoogle(false);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_run_days: prev.preferred_run_days.includes(day)
        ? prev.preferred_run_days.filter((d) => d !== day)
        : [...prev.preferred_run_days, day],
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          locale: formData.locale,
          experience_level: formData.experience_level || null,
          weekly_available_hours: formData.weekly_available_hours,
          preferred_run_days: formData.preferred_run_days,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      // Set locale cookie if it changed
      if (formData.locale !== profile.locale) {
        document.cookie = `NEXT_LOCALE=${formData.locale}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
        toast.success(t("settings.profile.profileUpdated"));
        // Full page reload to apply new locale
        window.location.reload();
        return;
      }

      toast.success(t("settings.profile.profileUpdated"));
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("settings.profile.errorSaving"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar Section */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar_url} alt={formData.full_name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl">
            {getInitials(formData.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{formData.full_name || t("settings.profile.noName")}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {t("settings.profile.basicInfo")}
        </h3>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t("settings.profile.fullName")}</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder={t("settings.profile.name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("settings.profile.email")}</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.profile.emailHint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">{t("settings.profile.language")}</Label>
            <Select
              value={formData.locale}
              onValueChange={(value) => setFormData({ ...formData, locale: value })}
            >
              <SelectTrigger id="locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nl">Nederlands</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Training Preferences */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {t("settings.profile.trainingPreferences")}
        </h3>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="experience_level">{t("settings.profile.experienceLevel")}</Label>
            <Select
              value={formData.experience_level}
              onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
            >
              <SelectTrigger id="experience_level">
                <SelectValue placeholder={t("settings.profile.selectLevel")} />
              </SelectTrigger>
              <SelectContent>
                {experienceLevelKeys.map((level) => (
                  <SelectItem key={level} value={level}>
                    <div>
                      <span>{t(`experienceLevels.${level}`)}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {t(`experienceLevels.${level}Desc`)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekly_hours">{t("settings.profile.availableHours")}</Label>
            <Select
              value={formData.weekly_available_hours.toString()}
              onValueChange={(value) => setFormData({ ...formData, weekly_available_hours: parseInt(value) })}
            >
              <SelectTrigger id="weekly_hours">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15].map((hours) => (
                  <SelectItem key={hours} value={hours.toString()}>
                    {t("settings.profile.hoursPerWeek", { hours })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>{t("settings.profile.preferredDays")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weekDayKeys.map((day) => (
                <label
                  key={day}
                  className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={formData.preferred_run_days.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <span className="text-sm">{t(`weekDays.${day}`)}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.profile.preferredDaysHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {t("settings.profile.linkedAccounts")}
        </h3>
        
        <div className="space-y-3">
          {/* Google Account */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Google</p>
                {googleIdentity ? (
                  <p className="text-sm text-muted-foreground">
                    {googleIdentity.identity_data?.email || t("settings.profile.connected")}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("settings.profile.notConnected")}
                  </p>
                )}
              </div>
            </div>
            
            {googleIdentity ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUnlinkGoogle}
                disabled={isUnlinkingGoogle || !hasMultipleIdentities}
                title={!hasMultipleIdentities ? t("settings.profile.cannotUnlinkOnly") : undefined}
              >
                {isUnlinkingGoogle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    {t("settings.profile.unlink")}
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
              >
                {isLinkingGoogle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    {t("settings.profile.link")}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Email Account (read-only info) */}
          {emailIdentity && (
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t("settings.profile.emailPassword")}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {t("settings.profile.primary")}
              </span>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground">
          {t("settings.profile.linkedAccountsHint")}
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("common.saveChanges")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

