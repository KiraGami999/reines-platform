import { Quote } from "lucide-react";
import { getTestimonialInitials, type TestimonialItem } from "@/lib/testimonials-data";

type Props = {
  testimonials: TestimonialItem[];
};

export function TestimonialsSection({ testimonials }: Props) {
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-[#243040] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Testimonials</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">What Our Clients Say</h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Hear from clients we&apos;ve partnered with across property development, construction, and manufacturing.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <Quote size={20} className="text-[#8fb9e8]" />
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-500">{t.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: t.accentColor }}
                >
                  {getTestimonialInitials(t.clientName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2d4a6b]">{t.clientName}</p>
                  <p className="truncate text-xs text-zinc-500">{t.clientTitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
