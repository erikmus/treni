import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

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
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block overflow-hidden">
        {/* Dynamic running-themed background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🏃‍♂️</div>
            <h2 className="text-2xl font-bold mb-2">{t("sidebarTitle")}</h2>
            <p className="text-muted-foreground">
              {t("sidebarSubtitle")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
