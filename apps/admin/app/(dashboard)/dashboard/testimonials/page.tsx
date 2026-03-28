import { getAuthUser } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { TestimonialsClient } from "./testimonials-client";

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { chapter: chapterId } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  if (!chapterId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Testimonials
        </h1>
        <p className="text-muted-foreground">
          Select a chapter to manage testimonials.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("sort_order");

  return (
    <TestimonialsClient
      testimonials={testimonials ?? []}
      chapterId={chapterId}
    />
  );
}
