import Link from "next/link";
import Image from "next/image";
import { formatKES } from "@/lib/utils";
import type { ProductListItem } from "@nairobi-fashion/lib";

interface Props {
  product: ProductListItem;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: Props) {
  const sorted = product.product_images?.sort((a, b) => a.sort_order - b.sort_order) ?? [];
  const primaryImage   = sorted[0];
  const secondaryImage = sorted[1];

  const isComingSoon = product.status === "coming_soon";
  const totalStock   = product.skus?.reduce((sum, s) => sum + s.stock_quantity, 0) ?? 0;
  const isSoldOut    = !isComingSoon && totalStock === 0;

  const discount =
    product.compare_price && product.compare_price > product.base_price
      ? Math.round(
          ((product.compare_price - product.base_price) / product.compare_price) * 100
        )
      : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col gap-3"
      aria-label={`View ${product.name}`}
    >
      {/* Image frame */}
      <div className="relative aspect-product w-full overflow-hidden bg-es-bone">

        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt ?? product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={[
              "object-cover object-top",
              secondaryImage
                ? "transition-opacity duration-500 group-hover:opacity-0"
                : "transition-transform duration-700 group-hover:scale-[1.03]",
            ].join(" ")}
          />
        ) : (
          <div className="w-full h-full bg-es-bone" />
        )}

        {secondaryImage && (
          <Image
            src={secondaryImage.url}
            alt={`${product.name} — alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {/* Discount badge */}
        {discount && !isSoldOut && (
          <span className="
            absolute top-3 left-3
            border border-es-champagne text-es-champagne-dk
            bg-white/90 backdrop-blur-sm
            px-2.5 py-1
            text-[10px] font-semibold tracking-label uppercase
          ">
            {discount}% off
          </span>
        )}

        {/* Coming soon overlay */}
        {isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[2px]">
            <span className="text-[11px] font-medium tracking-wider uppercase text-es-champagne-dk">
              Coming Soon
            </span>
          </div>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[2px]">
            <span className="text-[11px] font-medium tracking-wider uppercase text-es-mute">
              Sold Out
            </span>
          </div>
        )}

        {/* Quick-add - slides up on hover */}
        {!isSoldOut && !isComingSoon && (
          <div className="
            absolute bottom-0 inset-x-0
            bg-es-ink text-white
            py-3 text-center
            text-[11px] font-semibold tracking-label uppercase
            translate-y-full group-hover:translate-y-0
            transition-transform duration-300 ease-out
          ">
            Add to Bag
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="space-y-0.5 px-0.5">
        {product.category && (
          <p className="text-[10px] font-semibold tracking-label uppercase text-es-faint">
            {product.category}
          </p>
        )}
        <p className="text-sm font-medium text-es-char leading-snug line-clamp-2 group-hover:text-es-champagne-dk transition-colors duration-200">
          {product.name}
        </p>
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-sm font-semibold text-es-ink">
            {formatKES(product.base_price)}
          </span>
          {product.compare_price && product.compare_price > product.base_price && (
            <span className="text-xs text-es-faint line-through">
              {formatKES(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
