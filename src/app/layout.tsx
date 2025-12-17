import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Treni - Jouw persoonlijke hardloopcoach",
  description: "Gepersonaliseerde trainingsschema's die zich aanpassen aan jouw leven en doelen. Van 5km tot marathon.",
  keywords: ["hardlopen", "training", "marathon", "5km", "10km", "hardloopschema", "AI coach", "Garmin"],
  authors: [{ name: "Treni" }],
  openGraph: {
    title: "Treni - Jouw persoonlijke hardloopcoach",
    description: "Gepersonaliseerde trainingsschema's die zich aanpassen aan jouw leven en doelen.",
    url: "https://treni.app",
    siteName: "Treni",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Treni - Jouw persoonlijke hardloopcoach",
    description: "Gepersonaliseerde trainingsschema's die zich aanpassen aan jouw leven en doelen.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster richColors position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
