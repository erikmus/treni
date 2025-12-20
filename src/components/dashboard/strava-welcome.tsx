"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, PartyPopper, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function StravaWelcome() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("dashboard.stravaWelcome");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "strava") {
      setIsVisible(true);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, router]);

  if (!isVisible) return null;

  return (
    <div className="mx-4 lg:mx-6 mb-4 relative overflow-hidden rounded-xl border bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-4 md:p-6">
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-orange-500/20">
          <PartyPopper className="h-6 w-6 text-orange-600" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{t("title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("description")}
          </p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/settings/profile">
                <Mail className="h-4 w-4 mr-2" />
                {t("addEmail")}
              </Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)}>
              {t("later")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

