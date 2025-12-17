"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [formData, setFormData] = useState({
    full_name: profile.full_name,
    locale: profile.locale,
    experience_level: profile.experience_level || "",
    weekly_available_hours: profile.weekly_available_hours,
    preferred_run_days: profile.preferred_run_days,
  });

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

