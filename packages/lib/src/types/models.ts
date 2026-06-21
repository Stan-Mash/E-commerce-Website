/** Domain models used across web + workers — derived from DB rows with joins. */

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  cloudinary_public_id: string | null;
  media_type: "image" | "video";
  sort_order: number;
}

export interface ProductVideo {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
}

export interface SKU {
  id: string;
  size: string;
  color: string | null;
  color_hex: string | null;
  stock_quantity: number;
  sku_code: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  base_price: number;
  compare_price: number | null;
  product_images?: Pick<ProductImage, "url" | "alt" | "sort_order">[];
  skus?: Pick<SKU, "id" | "size" | "stock_quantity">[];
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  base_price: number;
  compare_price: number | null;
  material: string | null;
  care_instructions: string | null;
  is_featured: boolean;
  status: string;
  product_images?: ProductImage[];
  product_videos?: ProductVideo[];
  skus?: SKU[];
}

export interface OrderSummary {
  id: string;
  order_ref: string;
  status: string;
  total: number;
  delivery_type: "pickup" | "door";
  phone: string;
  created_at: string;
}
