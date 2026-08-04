import Image from "next/image";
import type { ClientLogoItem } from "@/lib/client-logos-data";

type Props = {
  logos: ClientLogoItem[];
};

function LogoMark({ logo }: { logo: ClientLogoItem }) {
  const darkSrc = logo.darkLogoUrl || logo.lightLogoUrl;

  const content = (
    <div className="relative h-12 w-full sm:h-14">
      {/* Light-mode variant */}
      <Image
        src={logo.lightLogoUrl}
        alt={logo.name}
        fill
        unoptimized={logo.lightLogoUrl.startsWith("/api/media")}
        sizes="200px"
        className="object-contain dark:hidden"
      />
      {/* Dark-mode variant — falls back to the light logo if none was uploaded */}
      <Image
        src={darkSrc}
        alt={logo.name}
        fill
        unoptimized={darkSrc.startsWith("/api/media")}
        sizes="200px"
        className="hidden object-contain dark:block"
      />
    </div>
  );

  if (logo.websiteUrl) {
    return (
      <a
        href={logo.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center px-4 py-2 transition-opacity hover:opacity-80"
        aria-label={logo.name}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-2" aria-label={logo.name}>
      {content}
    </div>
  );
}

export function ClientLogosSection({ logos }: Props) {
  if (logos.length === 0) return null;

  return (
    <section className="border-y border-zinc-100 bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8fb9e8]">Trusted By</span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#2d4a6b] sm:text-3xl">
            Clients We&apos;ve Worked With
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 items-center justify-items-center gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {logos.map((logo) => (
            <LogoMark key={logo.id} logo={logo} />
          ))}
        </div>
      </div>
    </section>
  );
}
