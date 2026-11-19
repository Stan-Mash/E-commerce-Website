import { NextResponse } from "next/server";

/**
 * Translates raw Postgres/Supabase error messages into plain-English messages
 * suitable for showing directly to admin users.
 */
export function friendlyDbError(pgMessage: string): string {
  if (pgMessage.includes("products_category_check")) {
    return "The selected category is not recognised. Please pick a valid category from the dropdown.";
  }
  if (pgMessage.includes("products_slug_key") || (pgMessage.includes("duplicate key") && pgMessage.includes("slug"))) {
    return "A product with this URL slug already exists. Please use a different slug.";
  }
  if (pgMessage.includes("duplicate key")) {
    return "A duplicate record already exists. Please check for conflicts and try again.";
  }
  if (pgMessage.includes("violates not-null constraint")) {
    return "A required field is missing. Please fill in all required fields and try again.";
  }
  if (pgMessage.includes("violates foreign key constraint")) {
    return "Cannot complete this action — this record is linked to existing orders or data.";
  }
  if (pgMessage.includes("violates check constraint")) {
    return "One or more field values are not valid. Please check the form and try again.";
  }
  return "Something went wrong saving the product. Please try again.";
}

// Wraps an API route handler so an unhandled throw returns a clean JSON 500
// instead of Next's generic HTML error page. Admin routes historically had no
// try/catch at all, so a malformed request body or an unexpected null could
// crash the handler with an opaque response instead of a usable error.
export function withApiErrorHandling<Args extends unknown[]>(
  routeName: string,
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(`[${routeName}] Unhandled error:`, err);
      const raw = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: friendlyDbError(raw) }, { status: 500 });
    }
  };
}
