import { Suspense } from "react";
import { Card, CardContent } from "@repo/ui/card";
import { Loader2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const t = await getTranslations("common");

  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-[420px]">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">{t("loading")}</p>
          </CardContent>
        </Card>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
