"use client";

import Link from "next/link";
import Image from "next/image";
import { BrandLogoAnchor } from "@/components/layout/BrandLogoAnchor";

export function AuthDesktopBrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <BrandLogoAnchor>
        <Image
          src="/logo-loader.png"
          alt="Reines logo"
          width={40}
          height={40}
          className="rounded-lg"
        />
      </BrandLogoAnchor>
      <span className="leading-tight">
        <span className="block text-xl font-bold tracking-tight text-white">Reines Property</span>
        <span className="block text-[10px] font-normal uppercase tracking-widest text-zinc-400">
          Development Limited
        </span>
      </span>
    </Link>
  );
}

export function AuthMobileBrandLogo() {
  return (
    <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
      <BrandLogoAnchor>
        <Image
          src="/logo-loader.png"
          alt="Reines logo"
          width={32}
          height={32}
          className="rounded-md"
        />
      </BrandLogoAnchor>
      <span className="leading-tight">
        <span className="block text-base font-bold text-[#2d4a6b]">Reines Property</span>
        <span className="block text-[9px] font-normal uppercase tracking-widest text-zinc-400">
          Development Limited
        </span>
      </span>
    </Link>
  );
}
