/**
 * Generated from Supabase schema.
 * Run `supabase gen types typescript` to regenerate after migrations.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: string;
          base_price: number;
          compare_price: number | null;
          material: string | null;
          care_instructions: string | null;
          is_featured: boolean;
          status: "active" | "draft" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      skus: {
        Row: {
          id: string;
          product_id: string;
          sku_code: string;
          size: string;
          color: string | null;
          color_hex: string | null;
          stock_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["skus"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["skus"]["Insert"]>;
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          cloudinary_public_id: string | null;
          media_type: "image" | "video";
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_images"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
      };
      product_videos: {
        Row: {
          id: string;
          product_id: string;
          cloudinary_url: string;
          cloudinary_public_id: string;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_videos"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["product_videos"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          order_ref: string;
          status: OrderStatus;
          subtotal: number;
          delivery_fee: number;
          total: number;
          delivery_type: "pickup" | "door";
          delivery_address: string | null;
          phone: string;
          notes: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          sku_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      mpesa_transactions: {
        Row: {
          id: string;
          order_id: string | null;
          checkout_request_id: string;
          merchant_request_id: string;
          status: "pending" | "completed" | "failed";
          amount: number | null;
          amount_paid: number | null;
          phone_number: string | null;
          mpesa_receipt_number: string | null;
          result_desc: string | null;
          transaction_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["mpesa_transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["mpesa_transactions"]["Insert"]>;
      };
      notification_jobs: {
        Row: {
          id: string;
          order_id: string;
          job_type: string;
          status: "queued" | "processing" | "done" | "failed";
          attempts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notification_jobs"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["notification_jobs"]["Insert"]>;
      };
      returns: {
        Row: {
          id: string;
          order_id: string;
          reason: string;
          status: "requested" | "approved" | "rejected" | "refunded";
          resolution: "refund" | "store_credit" | "exchange" | null;
          amount: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["returns"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["returns"]["Insert"]>;
      };
    };
    Views: Record<string, never>; // no views defined yet
    Functions: Record<string, never>;
    Enums: {
      order_status: OrderStatus;
    };
  };
};

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "payment_failed"
  | "processing"
  | "ready_for_pickup"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
