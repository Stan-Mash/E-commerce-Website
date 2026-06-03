import Link from "next/link";
import { ChevronRight } from "lucide-react";

const CATEGORY_HREFS: Record<string, string> = {
  woman: "/woman",
  women: "/woman",
  man: "/man",
  men: "/man",
  children: "/children",
  accessories: "/products?category=Accessories",
};

interface Props {
  category: string;
  productName: string;
}

export function ProductBreadcrumb({ category, productName }: Props) {
  const key = category.toLowerCase();
  const href = CATEGORY_HREFS[key] ?? `/products?category=${encodeURIComponent(category)}`;
  const label = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-muted">
      <Link href="/" className="hover:text-es-champagne-dk transition-colors">Home</Link>
      <ChevronRight size={12} />
      <Link href={href} className="hover:text-es-champagne-dk transition-colors">
        {label}
      </Link>
      <ChevronRight size={12} />
      <span className="text-ink line-clamp-1">{productName}</span>
    </nav>
  );
}
