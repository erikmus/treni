import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/components/signup-form";

export default async function SignupPage() {
  const t = await getTranslations("auth.signup");

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="relative w-6 h-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-md rotate-6" />
              <div className="absolute inset-0.5 bg-background rounded flex items-center justify-center">
                <span className="text-primary font-bold text-sm">T</span>
              </div>
            </div>
            Treni
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        {/* Dynamic running-themed background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-primary/10 to-accent/5" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        
        {/* Decorative elements */}
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2">{t("sidebarTitle")}</h2>
            <p className="text-muted-foreground">
              {t("sidebarSubtitle")}
            </p>
            
            {/* Features list */}
            <div className="mt-8 space-y-3 text-left">
              {[t("feature1"), t("feature2"), t("feature3")].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
