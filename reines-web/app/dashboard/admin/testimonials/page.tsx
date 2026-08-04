import { Quote } from "lucide-react";
import TestimonialsForm from "@/components/admin/TestimonialsForm";
import { getAdminTestimonials } from "@/lib/testimonials";

export const metadata = { title: "Testimonials - Reines Admin" };
export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const { settings, testimonials, usingFallback } = await getAdminTestimonials();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center">
          <Quote className="h-5 w-5 text-zinc-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#2d4a6b]">Testimonials</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the &quot;What Our Clients Say&quot; section shown on the public homepage.
          </p>
        </div>
      </div>

      <TestimonialsForm
        initialSettings={settings}
        initialTestimonials={testimonials}
        usingFallback={usingFallback}
      />
    </div>
  );
}
