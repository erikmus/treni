"use client";

import { useEffect } from "react";

interface SyncLocaleProps {
  locale: string;
}

export function SyncLocale({ locale }: SyncLocaleProps) {
  useEffect(() => {
    // Set the locale cookie
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
    // Reload the page to apply the new locale
    window.location.reload();
  }, [locale]);

  return null;
}

