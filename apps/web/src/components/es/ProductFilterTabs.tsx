"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "ALL", value: "All" },
  { label: "WOMAN", value: "Woman" },
  { label: "MAN", value: "Man" },
  { label: "CHILDREN", value: "Children" },
] as const;

export function ProductFilterTabs() {
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "All";

  return (
    <nav
      className="flex items-center gap-6 sm:gap-8"
      aria-label="Filter products by category"
    >
      {TABS.map(({ label, value }) => {
        const isActive = active === value;
        const href =
          value === "All" ? "/products" : `/products?category=${value}`;

        return (
          <Link
            key={value}
            href={href}
            className={cn(
              "pb-2 text-[11px] tracking-[.32em] uppercase transition-colors",
              isActive
                ? "border-b-2 border-es-plum text-es-ink font-medium"
                : "text-es-mute hover:text-es-ink"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
