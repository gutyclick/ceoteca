import Link from "next/link";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils/cn";

type LogoProps = {
  variant?: "icon" | "horizontal";
  useBrandAsset?: boolean;
  className?: string;
};

export function Logo({
  variant = "horizontal",
  useBrandAsset = false,
  className,
}: LogoProps) {
  const icon = (
    <svg
      aria-hidden="true"
      className="h-7 w-7 shrink-0"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="10" fill="url(#ceoteca-logo-bg)" />
      <path
        d="M20.5 9.7A7.1 7.1 0 1 0 20.5 22"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M21.5 15.9H15.8"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.74"
      />
      <defs>
        <linearGradient
          id="ceoteca-logo-bg"
          x1="4"
          y1="3"
          x2="29"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4f63ff" />
          <stop offset="0.52" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-3 rounded-button text-text-primary transition-opacity hover:opacity-90",
        className,
      )}
      aria-label={`Ir al inicio de ${siteConfig.name}`}
    >
      {useBrandAsset && variant === "horizontal" ? (
        <Image
          alt=""
          aria-hidden="true"
          className="h-10 w-auto max-w-[180px] object-contain"
          height={40}
          src="/images/ceoteca_logo.svg"
          width={180}
        />
      ) : (
        <>
          {icon}
          {variant === "horizontal" ? (
            <span className="text-base font-semibold tracking-normal">
              {siteConfig.name}
            </span>
          ) : null}
        </>
      )}
    </Link>
  );
}
