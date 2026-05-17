import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Props {
  category: string;
  productName: string;
}

export function ProductBreadcrumb({ category, productName }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-muted">
      <Link href="/" className="hover:text-brand-500 transition-colors">Home</Link>
      <ChevronRight size={12} />
      <Link
        href={`/products?category=${encodeURIComponent(category)}`}
        className="capitalize hover:text-brand-500 transition-colors"
      >
        {category}
      </Link>
      <ChevronRight size={12} />
      <span className="text-ink line-clamp-1">{productName}</span>
    </nav>
  );
}
