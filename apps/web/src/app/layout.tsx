import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing');
  
  return {
    title: t('pageTitle'),
    description: t('hero.subtitle'),
    keywords: ["running", "training", "marathon", "5K", "10K", "training plan", "AI coach", "Garmin"],
    authors: [{ name: "Treni" }],
    openGraph: {
      title: t('pageTitle'),
      description: t('hero.subtitle'),
      url: "https://treni.app",
      siteName: "Treni",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t('pageTitle'),
      description: t('hero.subtitle'),
    },
  };
}

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
