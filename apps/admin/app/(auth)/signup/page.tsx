import { Suspense } from "react";
import { Card, CardContent } from "@repo/ui/card";
import { Loader2 } from "lucide-react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-[420px]">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
