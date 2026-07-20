import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl } from "@/lib/site";

export interface BreadcrumbItem {
  label: string;
  href?: string; // omit on the current (last) page
}

interface Props {
  items: BreadcrumbItem[];
}

/** Visual breadcrumb nav + matching schema.org BreadcrumbList JSON-LD. */
export function Breadcrumb({ items }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-muted flex-wrap">
        {items.map((item, i) => (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} />}
            {item.href ? (
              <Link href={item.href} className="hover:text-es-champagne-dk transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink line-clamp-1">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}

const CATEGORY_HREFS: Record<string, string> = {
  woman: "/woman",
  women: "/woman",
  man: "/man",
  men: "/man",
  children: "/children",
  accessories: "/products?category=Accessories",
};

/** Convenience wrapper for product detail pages: Home > Category > Product. */
export function ProductBreadcrumb({ category, productName }: { category: string; productName: string }) {
  const key = category.toLowerCase();
  const href = CATEGORY_HREFS[key] ?? `/products?category=${encodeURIComponent(category)}`;
  const label = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  return (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label, href },
        { label: productName },
      ]}
    />
  );
}
