"use client";

import { useState } from "react";
import { Link2, RefreshCw, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StravaActionsProps {
  isConnected: boolean;
}

export function StravaActions({ isConnected }: StravaActionsProps) {
  const t = useTranslations("settings.integrations.strava");
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/strava/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days: 30 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      toast.success(data.message);
      router.refresh();
    } catch (error) {
      console.error("Strava sync error:", error);
      toast.error(t("syncError"));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/strava/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Disconnect failed");
      }

      toast.success(t("disconnected"));
      router.refresh();
    } catch (error) {
      console.error("Strava disconnect error:", error);
      toast.error(t("disconnectError"));
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <Button 
          size="sm" 
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isSyncing ? t("syncing") : t("syncNow")}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
        >
          {isDisconnecting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {t("disconnect")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Button size="sm" asChild>
        <a href="/api/auth/strava?mode=connect">
          <Link2 className="h-4 w-4 mr-2" />
          {t("connectWith")}
        </a>
      </Button>
    </div>
  );
}

