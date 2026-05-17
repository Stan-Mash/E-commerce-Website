import Link from "next/link";
import Image from "next/image";
import { formatKES } from "@/lib/utils";
import type { ProductListItem } from "@nairobi-fashion/lib";

interface Props {
  product: ProductListItem;
}

export function ProductCard({ product }: Props) {
  const primaryImage = product.product_images
    ?.sort((a, b) => a.sort_order - b.sort_order)[0];
  const totalStock = product.skus?.reduce((sum, s) => sum + s.stock_quantity, 0) ?? 0;
  const discount =
    product.compare_price && product.compare_price > product.base_price
      ? Math.round(
          ((product.compare_price - product.base_price) / product.compare_price) * 100
        )
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-2"
      aria-label={`View ${product.name}`}
    >
      {/* Image */}
      <div className="relative aspect-product w-full overflow-hidden rounded-xl bg-surface-warm">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-4xl">
            👗
          </div>
        )}
        {discount && (
          <span className="absolute top-2 left-2 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {totalStock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <span className="text-xs font-semibold text-ink-muted">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-xs text-ink-muted truncate">{product.category ?? ""}</p>
        <p className="text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-ink">{formatKES(product.base_price)}</span>
          {product.compare_price && product.compare_price > product.base_price && (
            <span className="text-xs text-ink-muted line-through">{formatKES(product.compare_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
